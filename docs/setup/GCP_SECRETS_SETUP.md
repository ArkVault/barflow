# ============================================
# BARMODE - GCP Secrets Setup Guide
# ============================================

## 📋 Prerequisites

Before deploying with CI/CD, you need to set up:
1. Google Cloud Project
2. Service Account with proper permissions
3. Secrets in Google Secret Manager
4. GitHub Secrets

---

## 🔐 Step 1: Create GCP Service Account

```bash
# Set your project ID
export PROJECT_ID="barflow-mvp"

# Create service account
gcloud iam service-accounts create barflow-deployer \
  --display-name="Barflow CI/CD Deployer" \
  --project=$PROJECT_ID

# Get the service account email
export SA_EMAIL="barflow-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Service Account: $SA_EMAIL"
```

---

## 🎫 Step 2: Grant Required Permissions

```bash
# Cloud Run Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"

# Artifact Registry Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer"

# Cloud Build Editor
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudbuild.builds.editor"

# Service Account User (to deploy as itself)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

# Secret Manager Accessor (to read secrets)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

# Storage Admin (for Cloud Build)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin"
```

---

## 🔑 Step 3: Create Service Account Key

```bash
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=$SA_EMAIL

# ⚠️ IMPORTANT: Keep this file secure! Never commit it to git.
echo "Key created: gcp-key.json"
```

---

## 🗄️ Step 4: Create Artifact Registry Repository

```bash
gcloud artifacts repositories create barflow \
  --repository-format=docker \
  --location=us-central1 \
  --description="Barflow container images"
```

---

## 🔒 Step 5: Create Secrets in Secret Manager

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets (replace with your actual values)
echo -n "https://your-project.supabase.co" | \
  gcloud secrets create NEXT_PUBLIC_SUPABASE_URL --data-file=-

echo -n "your-supabase-anon-key" | \
  gcloud secrets create NEXT_PUBLIC_SUPABASE_ANON_KEY --data-file=-

echo -n "pk_test_your-key" | \
  gcloud secrets create NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --data-file=-

echo -n "sk_test_your-key" | \
  gcloud secrets create STRIPE_SECRET_KEY --data-file=-

echo -n "whsec_your-webhook-secret" | \
  gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-

echo -n "your-gemini-api-key" | \
  gcloud secrets create GEMINI_API_KEY --data-file=-

echo -n "price_xxx" | \
  gcloud secrets create NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID --data-file=-

echo -n "price_xxx" | \
  gcloud secrets create NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID --data-file=-

echo -n "price_xxx" | \
  gcloud secrets create NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID --data-file=-

# This one will be updated after first deployment
echo -n "https://barflow-xxx-uc.a.run.app" | \
  gcloud secrets create NEXT_PUBLIC_APP_URL --data-file=-
```

---

## 🔗 Step 6: Grant Cloud Run Access to Secrets

```bash
# Get Cloud Run service account
export CLOUDRUN_SA="${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant access to each secret
for secret in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY \
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET \
  GEMINI_API_KEY NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID \
  NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID \
  NEXT_PUBLIC_APP_URL; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$CLOUDRUN_SA" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 📦 Step 7: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | `barflow-mvp` |
| `GCP_SA_KEY` | Contents of `gcp-key.json` (the entire JSON) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID` | Your monthly price ID |
| `NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID` | Your yearly price ID |
| `NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID` | Your chain price ID |
| `NEXT_PUBLIC_APP_URL` | Your Cloud Run URL (update after first deploy) |

---

## ✅ Step 8: Verify Setup

```bash
# List secrets
gcloud secrets list

# Verify IAM bindings
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SA_EMAIL" \
  --format="table(bindings.role)"

# Verify Artifact Registry
gcloud artifacts repositories list --location=us-central1
```

---

## 🚀 Ready to Deploy!

Once all secrets are configured:
1. Push to `main` branch
2. GitHub Actions will automatically build and deploy
3. Check the Actions tab for deployment status

---

## 🗑️ Cleanup

```bash
# Delete the local key file after adding to GitHub
rm gcp-key.json

# To revoke a compromised key
gcloud iam service-accounts keys list --iam-account=$SA_EMAIL
gcloud iam service-accounts keys delete KEY_ID --iam-account=$SA_EMAIL
```
