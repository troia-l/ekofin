import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

pd.set_option('display.max_columns', None)
pd.set_option('display.float_format', '{:.3f}'.format)

print("=== Phase 1: Data Loading & EDA ===")
df = pd.read_csv('veriseti_01_doldurulmus.csv')

print("=== SHAPE ===")
print(df.shape)

print("\n=== DTYPES ===")
print(df.dtypes)

print("\n=== MISSING VALUES ===")
print(df.isnull().sum())

print("\n=== DESCRIPTIVE STATISTICS ===")
print(df.describe())

print("\n=== SAMPLE ROWS ===")
print(df.head(10))

# Verify panel structure
print("\nCompanies:", df['CompanyID'].nunique())
print("Years:", sorted(df['Year'].unique()))
print("Rows per company (should be 11):")
print(df.groupby('CompanyID').size().describe())

# Check for duplicate company-year pairs
dupes = df.duplicated(subset=['CompanyID', 'Year'])
print(f"\nDuplicate company-year pairs: {dupes.sum()}")

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# Distribution
axes[0].hist(df['ESG_Overall'], bins=40, edgecolor='white')
axes[0].set_title('ESG_Overall distribution')
axes[0].set_xlabel('ESG_Overall')

# By industry
df.groupby('Industry')['ESG_Overall'].mean().sort_values().plot(kind='barh', ax=axes[1])
axes[1].set_title('Mean ESG_Overall by industry')

# Over time
df.groupby('Year')['ESG_Overall'].mean().plot(ax=axes[2], marker='o')
axes[2].set_title('Mean ESG_Overall over time')

plt.tight_layout()
plt.savefig('eda_target.png', dpi=150)
plt.close()
print("Saved eda_target.png")

# Skewness and kurtosis
print(f"Skewness: {df['ESG_Overall'].skew():.4f}")
print(f"Kurtosis: {df['ESG_Overall'].kurtosis():.4f}")

# CRITICAL: Verify if ESG_Overall is a direct function of sub-scores
df['esg_avg'] = (df['ESG_Environmental'] + df['ESG_Social'] + df['ESG_Governance']) / 3
residual = (df['ESG_Overall'] - df['esg_avg']).abs()

print("Max absolute deviation from simple average:", residual.max())
print("Mean absolute deviation:", residual.mean())

numeric_cols = ['Revenue', 'ProfitMargin', 'MarketCap', 'GrowthRate',
                'ESG_Environmental', 'ESG_Social', 'ESG_Governance',
                'CarbonEmissions', 'WaterUsage', 'EnergyConsumption', 'ESG_Overall']

corr = df[numeric_cols].corr()

plt.figure(figsize=(12, 10))
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, mask=mask, annot=True, fmt='.2f', cmap='RdYlGn',
            center=0, linewidths=0.5)
plt.title('Feature correlation matrix')
plt.tight_layout()
plt.savefig('eda_correlation.png', dpi=150)
plt.close()
print("Saved eda_correlation.png")

print("\n=== Phase 2: Feature Engineering ===")
df = df.sort_values(['CompanyID', 'Year']).reset_index(drop=True)

lag_cols = ['ESG_Environmental', 'ESG_Social', 'ESG_Governance',
            'Revenue', 'ProfitMargin', 'CarbonEmissions']

for col in lag_cols:
    for lag in [1, 2]:
        df[f'{col}_lag{lag}'] = df.groupby('CompanyID')[col].shift(lag)

delta_cols = ['Revenue', 'MarketCap', 'CarbonEmissions', 'WaterUsage', 'EnergyConsumption']

for col in delta_cols:
    df[f'{col}_yoy'] = df.groupby('CompanyID')[col].pct_change()

# Derived ratio features
df['carbon_intensity'] = df['CarbonEmissions'] / (df['Revenue'] + 1e-9)
df['water_intensity'] = df['WaterUsage'] / (df['Revenue'] + 1e-9)
df['energy_intensity'] = df['EnergyConsumption'] / (df['Revenue'] + 1e-9)
df['profit_per_marketcap'] = df['ProfitMargin'] / (df['MarketCap'] + 1e-9)

# Rolling statistics (3-year window)
for col in ['ESG_Environmental', 'ESG_Social', 'ESG_Governance', 'CarbonEmissions']:
    df[f'{col}_roll3_mean'] = df.groupby('CompanyID')[col].transform(
        lambda x: x.shift(1).rolling(3, min_periods=1).mean()
    )
    df[f'{col}_roll3_std'] = df.groupby('CompanyID')[col].transform(
        lambda x: x.shift(1).rolling(3, min_periods=1).std()
    )

# One-hot encode Industry and Region
df = pd.get_dummies(df, columns=['Industry', 'Region'], drop_first=False)

# Encode Year as cyclic or ordinal
df['Year_norm'] = (df['Year'] - df['Year'].min()) / (df['Year'].max() - df['Year'].min())

TRACK_A_FEATURES = [
    'ESG_Environmental', 'ESG_Social', 'ESG_Governance',
    'ESG_Environmental_lag1', 'ESG_Social_lag1', 'ESG_Governance_lag1',
    'ESG_Environmental_lag2', 'ESG_Social_lag2', 'ESG_Governance_lag2',
    'ESG_Environmental_roll3_mean', 'ESG_Social_roll3_mean', 'ESG_Governance_roll3_mean',
    'Revenue', 'ProfitMargin', 'MarketCap', 'GrowthRate',
    'CarbonEmissions', 'WaterUsage', 'EnergyConsumption',
    'carbon_intensity', 'water_intensity', 'energy_intensity',
    'Revenue_yoy', 'CarbonEmissions_yoy', 'Year_norm',
] + [c for c in df.columns if c.startswith('Industry_') or c.startswith('Region_')]

TRACK_B_FEATURES = [
    'Revenue', 'ProfitMargin', 'MarketCap', 'GrowthRate',
    'CarbonEmissions', 'WaterUsage', 'EnergyConsumption',
    'carbon_intensity', 'water_intensity', 'energy_intensity',
    'Revenue_yoy', 'CarbonEmissions_yoy',
    'profit_per_marketcap', 'Year_norm',
] + [c for c in df.columns if c.startswith('Industry_') or c.startswith('Region_')]

TARGET = 'ESG_Overall'

train = df[df['Year'] <= 2021].copy()
val   = df[(df['Year'] >= 2022) & (df['Year'] <= 2023)].copy()
test  = df[df['Year'] >= 2024].copy()

print(f"Train: {len(train)} rows | Val: {len(val)} rows | Test: {len(test)} rows")

def split_Xy(data, features):
    subset = data[features + [TARGET]].dropna()
    return subset[features], subset[TARGET]

X_train_A, y_train = split_Xy(train, TRACK_A_FEATURES)
X_val_A,   y_val   = split_Xy(val,   TRACK_A_FEATURES)
X_test_A,  y_test  = split_Xy(test,  TRACK_A_FEATURES)

X_train_B, y_train_B = split_Xy(train, TRACK_B_FEATURES)
X_val_B,   y_val_B   = split_Xy(val,   TRACK_B_FEATURES)
X_test_B,  y_test_B  = split_Xy(test,  TRACK_B_FEATURES)


print("\n=== Phase 3: Model Training ===")
from sklearn.linear_model import Ridge, Lasso
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def evaluate(name, y_true, y_pred):
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae  = mean_absolute_error(y_true, y_pred)
    r2   = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1e-9))) * 100
    print(f"[{name}] RMSE: {rmse:.3f} | MAE: {mae:.3f} | R²: {r2:.4f} | MAPE: {mape:.2f}%")
    return {'model': name, 'RMSE': rmse, 'MAE': mae, 'R2': r2, 'MAPE': mape}

results = []

# Ridge — Track A
ridge_a = Pipeline([('scaler', StandardScaler()), ('model', Ridge(alpha=1.0))])
ridge_a.fit(X_train_A, y_train)
results.append(evaluate("Ridge_TrackA", y_val, ridge_a.predict(X_val_A)))

# Ridge — Track B
ridge_b = Pipeline([('scaler', StandardScaler()), ('model', Ridge(alpha=1.0))])
ridge_b.fit(X_train_B, y_train_B)
results.append(evaluate("Ridge_TrackB", y_val_B, ridge_b.predict(X_val_B)))

from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
import lightgbm as lgbm

# XGBoost — Track A
xgb_a = XGBRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    early_stopping_rounds=50,
    eval_metric='rmse',
    random_state=42,
    n_jobs=-1
)
xgb_a.fit(X_train_A, y_train, eval_set=[(X_val_A, y_val)], verbose=False)
results.append(evaluate("XGBoost_TrackA", y_val, xgb_a.predict(X_val_A)))

# XGBoost — Track B
xgb_b = XGBRegressor(
    n_estimators=500, learning_rate=0.05, max_depth=6,
    subsample=0.8, colsample_bytree=0.8, early_stopping_rounds=50,
    eval_metric='rmse', random_state=42, n_jobs=-1
)
xgb_b.fit(X_train_B, y_train_B, eval_set=[(X_val_B, y_val_B)], verbose=False)
results.append(evaluate("XGBoost_TrackB", y_val_B, xgb_b.predict(X_val_B)))

# LightGBM — Track B
lgbm_b = LGBMRegressor(
    n_estimators=500, learning_rate=0.05, num_leaves=63,
    subsample=0.8, colsample_bytree=0.8, random_state=42, n_jobs=-1
)
lgbm_b.fit(
    X_train_B, y_train_B,
    eval_set=[(X_val_B, y_val_B)],
    callbacks=[lgbm.early_stopping(50, verbose=False), lgbm.log_evaluation(0)]
)
results.append(evaluate("LightGBM_TrackB", y_val_B, lgbm_b.predict(X_val_B)))

from sklearn.model_selection import RandomizedSearchCV
from sklearn.model_selection import TimeSeriesSplit

param_dist = {
    'n_estimators': [300, 500, 700],
    'max_depth': [4, 5, 6, 7],
    'learning_rate': [0.01, 0.03, 0.05, 0.1],
    'subsample': [0.7, 0.8, 0.9],
    'colsample_bytree': [0.7, 0.8, 0.9],
    'min_child_weight': [1, 3, 5],
    'reg_alpha': [0, 0.1, 0.5],
    'reg_lambda': [1, 1.5, 2],
}

tscv = TimeSeriesSplit(n_splits=5)

X_tv_B = pd.concat([X_train_B, X_val_B])
y_tv   = pd.concat([y_train_B, y_val_B])

search = RandomizedSearchCV(
    XGBRegressor(random_state=42, n_jobs=-1),
    param_distributions=param_dist,
    n_iter=30,
    scoring='neg_root_mean_squared_error',
    cv=tscv,
    random_state=42,
    n_jobs=-1,
    verbose=1
)
search.fit(X_tv_B, y_tv)
print("Best params:", search.best_params_)
print("Best CV RMSE:", -search.best_score_)

best_model = search.best_estimator_
results.append(evaluate("XGBoost_Tuned_TrackB", y_test_B, best_model.predict(X_test_B)))

results_df = pd.DataFrame(results).sort_values('RMSE')
print("\n=== MODEL COMPARISON ===")
print(results_df.to_string(index=False))

print("\n=== Phase 4: Evaluation & Explainability ===")
y_pred_final = best_model.predict(X_test_B)
evaluate("FINAL — XGBoost_Tuned_TrackB (test set)", y_test_B, y_pred_final)

residuals = y_test_B - y_pred_final
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.scatter(y_pred_final, residuals, alpha=0.4, s=10)
plt.axhline(0, color='red', linestyle='--')
plt.xlabel('Predicted'); plt.ylabel('Residual')
plt.title('Residuals vs Predicted')

plt.subplot(1, 2, 2)
stats.probplot(residuals, plot=plt)
plt.title('Q-Q plot of residuals')

plt.tight_layout()
plt.savefig('eval_residuals.png', dpi=150)
plt.close()
print("Saved eval_residuals.png")

test_eval = test.loc[X_test_B.index].copy()
test_eval['y_pred'] = y_pred_final
test_eval['residual'] = y_test_B.values - y_pred_final
test_eval['abs_error'] = test_eval['residual'].abs()

industry_col = [c for c in test_eval.columns if c.startswith('Industry_')]
test_eval['Industry_name'] = pd.from_dummies(test_eval[industry_col]).iloc[:, 0].str.replace('Industry_', '')

print("\nMean absolute error by industry:")
print(test_eval.groupby('Industry_name')['abs_error'].mean().sort_values(ascending=False))

import shap

explainer = shap.TreeExplainer(best_model)
shap_values = explainer.shap_values(X_test_B)

plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X_test_B, show=False)
plt.tight_layout()
plt.savefig('shap_summary.png', dpi=150)
plt.close()
print("Saved shap_summary.png")

plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X_test_B, plot_type='bar', max_display=10, show=False)
plt.tight_layout()
plt.savefig('shap_bar.png', dpi=150)
plt.close()
print("Saved shap_bar.png")

# Confidence intervals via quantile regression
for q in [0.1, 0.5, 0.9]:
    lgbm_q = LGBMRegressor(objective='quantile', alpha=q, n_estimators=300,
                            learning_rate=0.05, random_state=42)
    lgbm_q.fit(X_train_B, y_train_B)
    test_eval[f'pred_q{int(q*100)}'] = lgbm_q.predict(X_test_B)

print(test_eval[['ESG_Overall', 'y_pred', 'pred_q10', 'pred_q50', 'pred_q90']].head(10))

print("\n=== Phase 5: Enterprise Deployment ===")
import mlflow
import mlflow.xgboost
import json

mlflow.set_experiment("esg_scoring_v1")

with mlflow.start_run(run_name="XGBoost_TrackB_Tuned"):
    mlflow.log_params(best_model.get_params())
    
    y_pred_log = best_model.predict(X_test_B)
    mlflow.log_metric("test_rmse", np.sqrt(mean_squared_error(y_test_B, y_pred_log)))
    mlflow.log_metric("test_r2",   r2_score(y_test_B, y_pred_log))
    mlflow.log_metric("test_mae",  mean_absolute_error(y_test_B, y_pred_log))
    
    with open("track_b_features.json", "w") as f:
        json.dump(TRACK_B_FEATURES, f)
    mlflow.log_artifact("track_b_features.json")
    
    mlflow.xgboost.log_model(best_model, artifact_path="model",
                              registered_model_name="esg_overall_predictor")
    
    for img in ['eda_target.png', 'eda_correlation.png', 'eval_residuals.png',
                'shap_summary.png', 'shap_bar.png']:
        mlflow.log_artifact(img)
    
    print("Run logged to MLflow.")

import joblib

joblib.dump(best_model, 'esg_model_trackB.pkl')
joblib.dump(TRACK_B_FEATURES, 'esg_features_trackB.pkl')

loaded_model    = joblib.load('esg_model_trackB.pkl')
loaded_features = joblib.load('esg_features_trackB.pkl')
assert np.allclose(loaded_model.predict(X_test_B[:5]), best_model.predict(X_test_B[:5]))
print("Model serialisation verified.")

print("\n=== Phase 6: Monitoring & Maintenance ===")
def psi(expected, actual, bins=10):
    min_val = min(expected.min(), actual.min())
    max_val = max(expected.max(), actual.max())
    bin_edges = np.linspace(min_val, max_val, bins + 1)
    
    exp_pct = np.histogram(expected, bins=bin_edges)[0] / len(expected)
    act_pct = np.histogram(actual,   bins=bin_edges)[0] / len(actual)
    
    exp_pct = np.where(exp_pct == 0, 0.0001, exp_pct)
    act_pct = np.where(act_pct == 0, 0.0001, act_pct)
    
    psi_val = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return psi_val

drift_report = {}
numerical_features = ['Revenue', 'ProfitMargin', 'MarketCap', 'GrowthRate',
                       'CarbonEmissions', 'WaterUsage', 'EnergyConsumption']

for col in numerical_features:
    if col in X_train_B.columns and col in X_test_B.columns:
        score = psi(X_train_B[col].dropna().values, X_test_B[col].dropna().values)
        drift_report[col] = score
        status = "[DRIFT]" if score > 0.2 else ("[Moderate]" if score > 0.1 else "[Stable]")
        print(f"{col:30s}: PSI = {score:.4f}  {status}")

def monitor_batch(X_new, y_new, model, threshold_rmse=5.0):
    y_pred = model.predict(X_new)
    rmse = np.sqrt(mean_squared_error(y_new, y_pred))
    r2   = r2_score(y_new, y_pred)
    
    print(f"Batch RMSE: {rmse:.3f} | R²: {r2:.4f}")
    
    if rmse > threshold_rmse:
        print(f"[ALERT]: RMSE {rmse:.3f} exceeds threshold {threshold_rmse}.")
        print("   -> Consider retraining or investigating data quality.")
    else:
        print("[OK] Model performance within acceptable range.")
    
    return {'rmse': rmse, 'r2': r2, 'alert': rmse > threshold_rmse}

print("\nMonitoring Test Set:")
monitor_batch(X_test_B, y_test_B, best_model)
print("Pipeline complete.")
