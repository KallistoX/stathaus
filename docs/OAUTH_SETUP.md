# OAuth2/OIDC Setup Guide for StatHaus

StatHaus supports cloud synchronization using any OAuth2/OIDC-compliant authentication provider. This guide covers how to configure different providers.

## Overview

StatHaus uses OAuth2 with OIDC (OpenID Connect) for secure user authentication. The backend automatically discovers provider endpoints using the standard `.well-known/openid-configuration` discovery mechanism.

### v1.2.0 Features
- **Auto-Login**: If the user has a valid session, they are automatically logged in on app start
- **Dashboard Entrypoint**: Authenticated users land directly on the dashboard

## Supported Providers

StatHaus works with **any** OAuth2/OIDC-compliant provider:

- **Authentik** (Self-hosted, recommended)
- **Keycloak** (Self-hosted, enterprise-grade)
- **Auth0** (Cloud service)
- **Google OAuth** (Google accounts)
- **GitHub OAuth** (GitHub accounts)
- **Microsoft Entra ID** (Azure AD)
- **Okta** (Enterprise identity)
- Any other OIDC-compliant provider

## Required OAuth2 Configuration

For any provider, you need to configure:

1. **Application Type**: Web application
2. **Grant Type**: Authorization Code with PKCE (Proof Key for Code Exchange)
3. **Redirect URI**: `https://your-stathaus-domain.com/auth/callback`
4. **Scopes**: Minimum `openid profile email`
5. **Token Endpoint Authentication**: Client Secret Post

## Provider-Specific Setup

### Authentik (Recommended for Self-Hosted)

#### Automatic Setup (with Ansible)

If you have Authentik deployed in your cluster, StatHaus can be configured automatically:

```bash
# The playbook will detect Authentik and configure OAuth automatically
ansible-playbook ansible/playbooks/25-stathaus.yml
```

This creates:
- OAuth2 provider in Authentik
- Application configuration
- Client ID and secret
- Kubernetes secret with credentials

#### Manual Setup

1. **Create Provider**:
   - Go to Authentik Admin → Applications → Providers
   - Click "Create" → "OAuth2/OIDC Provider"
   - Name: `stathaus-provider`
   - Client Type: `Confidential`
   - Redirect URIs: `https://your-domain.com/auth/callback`
   - Scopes: Select `openid`, `profile`, `email`

2. **Create Application**:
   - Go to Applications → Create
   - Name: `StatHaus - Meter Readings`
   - Slug: `stathaus`
   - Provider: Select the provider created above

3. **Get Credentials**:
   - Open the provider
   - Copy the Client ID and Client Secret

4. **Create Kubernetes Secret**:
   ```bash
   kubectl create secret generic stathaus-oidc-credentials \
     --namespace stathaus \
     --from-literal=issuer=https://sso.your-domain.com \
     --from-literal=client_id=YOUR_CLIENT_ID \
     --from-literal=client_secret=YOUR_CLIENT_SECRET
   ```

### Keycloak

1. **Create Realm** (or use existing):
   - Go to Keycloak Admin Console
   - Create realm or select existing

2. **Create Client**:
   - Go to Clients → Create
   - Client ID: `stathaus`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `https://your-domain.com/auth/callback`
   - Click Save

3. **Configure Client**:
   - Go to Credentials tab
   - Copy the Client Secret

4. **Create Kubernetes Secret**:
   ```bash
   kubectl create secret generic stathaus-oidc-credentials \
     --namespace stathaus \
     --from-literal=issuer=https://keycloak.your-domain.com/realms/YOUR_REALM \
     --from-literal=client_id=stathaus \
     --from-literal=client_secret=YOUR_CLIENT_SECRET
   ```

### Auth0

1. **Create Application**:
   - Go to Auth0 Dashboard → Applications → Create Application
   - Name: `StatHaus`
   - Type: `Regular Web Applications`
   - Click Create

2. **Configure Application**:
   - Allowed Callback URLs: `https://your-domain.com/auth/callback`
   - Allowed Logout URLs: `https://your-domain.com`
   - Copy Domain, Client ID, and Client Secret

3. **Create Kubernetes Secret**:
   ```bash
   kubectl create secret generic stathaus-oidc-credentials \
     --namespace stathaus \
     --from-literal=issuer=https://YOUR_TENANT.auth0.com \
     --from-literal=client_id=YOUR_CLIENT_ID \
     --from-literal=client_secret=YOUR_CLIENT_SECRET
   ```

### Google OAuth

1. **Create Project** (if needed):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing

2. **Configure OAuth Consent Screen**:
   - Go to APIs & Services → OAuth consent screen
   - Configure consent screen with app information

3. **Create OAuth Client**:
   - Go to APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: `Web application`
   - Authorized redirect URIs: `https://your-domain.com/auth/callback`
   - Copy Client ID and Client Secret

4. **Create Kubernetes Secret**:
   ```bash
   kubectl create secret generic stathaus-oidc-credentials \
     --namespace stathaus \
     --from-literal=issuer=https://accounts.google.com \
     --from-literal=client_id=YOUR_CLIENT_ID.apps.googleusercontent.com \
     --from-literal=client_secret=YOUR_CLIENT_SECRET
   ```

### GitHub OAuth

1. **Create OAuth App**:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Application name: `StatHaus`
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/auth/callback`
   - Click Register application

2. **Get Credentials**:
   - Copy Client ID
   - Generate a new client secret and copy it

3. **Create Kubernetes Secret**:
   ```bash
   # Note: GitHub doesn't provide OIDC discovery, use Auth0 or another provider wrapper
   # Or use a service like ory/hydra to wrap GitHub OAuth
   ```

### Microsoft Entra ID (Azure AD)

1. **Register Application**:
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Click "New registration"
   - Name: `StatHaus`
   - Redirect URI: `https://your-domain.com/auth/callback`
   - Click Register

2. **Configure Application**:
   - Go to Certificates & secrets
   - Create new client secret
   - Copy the secret value

3. **API Permissions**:
   - Go to API permissions
   - Add permissions: `openid`, `profile`, `email`

4. **Create Kubernetes Secret**:
   ```bash
   kubectl create secret generic stathaus-oidc-credentials \
     --namespace stathaus \
     --from-literal=issuer=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0 \
     --from-literal=client_id=YOUR_APPLICATION_ID \
     --from-literal=client_secret=YOUR_CLIENT_SECRET
   ```

## Deployment Configuration

### Ansible Inventory Variables

Add to your `ansible/inventory/hosts.yml`:

```yaml
all:
  hosts:
    your-server:
      # Required
      stathaus_domain: "stathaus.your-domain.com"

      # Optional - Custom Redis (defaults to shared Redis DB 2)
      stathaus_redis_host: "custom-redis.namespace.svc.cluster.local"
      stathaus_redis_port: "6379"
      stathaus_redis_db: "0"
      stathaus_redis_password_secret: "redis-credentials"
      stathaus_redis_password_key: "password"
      stathaus_redis_password_namespace: "default"

      # Optional - Custom backend image
      stathaus_backend_image_repository: "ghcr.io/yourorg/stathaus-backend"
      stathaus_backend_image_tag: "v1.0.0"
```

### Manual Kubernetes Secret Creation

If not using Authentik auto-setup, create the secret manually:

```bash
kubectl create secret generic stathaus-oidc-credentials \
  --namespace stathaus \
  --from-literal=issuer=https://your-oauth-provider.com \
  --from-literal=client_id=your-client-id \
  --from-literal=client_secret=your-client-secret
```

### Deploy

```bash
ansible-playbook ansible/playbooks/25-stathaus.yml
```

## Verification

After deployment:

1. **Check Backend Logs**:
   ```bash
   kubectl logs -n stathaus -l app.kubernetes.io/name=stathaus -c backend
   ```

   Should see:
   ```
   OAuth2/OIDC Provider discovered: { issuer: 'https://...', ... }
   ```

2. **Test OAuth Config Endpoint**:
   ```bash
   curl https://your-domain.com/api/auth/config
   ```

   Should return provider configuration

3. **Test in Browser**:
   - Open `https://your-domain.com`
   - Go to Settings → Cloud Sync
   - Click "Sign in"
   - Should redirect to OAuth provider
   - Complete login
   - Should redirect back with success

## Troubleshooting

### "OAuth service initialization failed"

**Cause**: Backend cannot discover OIDC configuration

**Solution**:
- Verify `OAUTH_ISSUER` is correct
- Test discovery manually:
  ```bash
  curl https://your-issuer.com/.well-known/openid-configuration
  ```
- Check backend logs for details

### "Invalid redirect_uri"

**Cause**: Redirect URI not configured in OAuth provider

**Solution**:
- Add `https://your-domain.com/auth/callback` to allowed redirect URIs
- Ensure exact match (no trailing slashes)

### "CORS error during authentication"

**Cause**: OAuth provider blocking cross-origin requests

**Solution**:
- This should NOT happen in production (both served over HTTPS)
- Verify StatHaus is served over HTTPS
- Check OAuth provider CORS settings
- Try clearing browser cache

### "Token validation failed"

**Cause**: Token expired or invalid

**Solution**:
- Check system time is correct
- Verify client secret matches
- Token automatically refreshes - wait and retry

### Backend pod not starting

**Cause**: Missing Redis or OAuth credentials

**Solution**:
- Check Redis secret exists:
  ```bash
  kubectl get secret -n shared-services shared-redis-credentials
  ```
- Check OAuth secret exists:
  ```bash
  kubectl get secret -n stathaus stathaus-oidc-credentials
  ```
- If using custom Redis, verify connection details

## Security Considerations

1. **HTTPS Only**: Both StatHaus and OAuth provider must use HTTPS
2. **PKCE**: Authorization code flow uses PKCE for additional security
3. **State Parameter**: CSRF protection via state parameter validation
4. **Token Storage**: Tokens stored in browser localStorage (consider secure cookies for sensitive deployments)
5. **Token Refresh**: Automatic token refresh 5 minutes before expiry
6. **Client Secret**: Stored in Kubernetes secret (not in code)
7. **Scopes**: Request minimum scopes needed (`openid profile email`)

## Advanced Configuration

### Custom Scopes

Add to inventory:

```yaml
stathaus_oauth_scopes: "openid profile email custom-scope"
```

### Custom Token Endpoint

For non-standard providers, you can override discovery:

```yaml
stathaus_oauth_token_endpoint: "https://custom.provider.com/oauth/token"
stathaus_oauth_userinfo_endpoint: "https://custom.provider.com/oauth/userinfo"
```

### Multiple Environments

Use different secrets for different environments:

```bash
# Production
kubectl create secret generic stathaus-oidc-credentials \
  --namespace stathaus-prod \
  --from-literal=issuer=https://sso.prod.com \
  --from-literal=client_id=prod-client \
  --from-literal=client_secret=prod-secret

# Staging
kubectl create secret generic stathaus-oidc-credentials \
  --namespace stathaus-staging \
  --from-literal=issuer=https://sso.staging.com \
  --from-literal=client_id=staging-client \
  --from-literal=client_secret=staging-secret
```

## Support

For issues:
1. Check backend logs: `kubectl logs -n stathaus -l app.kubernetes.io/name=stathaus -c backend`
2. Verify OAuth provider configuration
3. Test OIDC discovery endpoint manually
4. Open GitHub issue with logs and provider details

## References

- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [OIDC Specification](https://openid.net/connect/)
- [PKCE RFC](https://datatracker.ietf.org/doc/html/rfc7636)
- [Authentik Documentation](https://goauthentik.io/docs/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
