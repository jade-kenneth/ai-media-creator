# Using Multiple GitHub Accounts (Copilot + Different Repo Owner)

This guide explains how to:

- Use GitHub Account A for **GitHub Copilot (VS Code)**
- Use GitHub Account B to **push to a repository**
- Avoid authentication conflicts
- Fix common remote URL errors

---

## Concept

- VS Code Copilot uses your **VS Code GitHub login**
- `git push` / `git pull` uses your **Git remote authentication (SSH or HTTPS)**
- These can be different accounts

Recommended setup:

- Copilot -> Account A
- Git (repo owner) -> Account B via SSH

---

## Recommended: Use SSH for Account B

### 1. Ensure SSH key exists for Account B

List your SSH keys:

```bash
ls -al ~/.ssh
```

If you already have one registered in GitHub Account B, identify its filename.

Example:

```text
id_ed25519_github_b
id_ed25519_github_b.pub
```

### 2. Add SSH config alias

Edit SSH config:

```bash
nano ~/.ssh/config
```

Add:

```sshconfig
Host github-b
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github_b
  IdentitiesOnly yes
```

Replace the `IdentityFile` path with your actual private key.

Set correct permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/config
```

### 3. Test SSH authentication

```bash
ssh -T git@github-b
```

Expected:

```text
Hi <username>! You've successfully authenticated...
```

If you see:

```text
Could not resolve hostname github-b
```

Your SSH config is missing or incorrect.

### 4. Fix repository remote

Check current remote:

```bash
git remote -v
```

If you see something invalid like:

```text
git:https://github.com/...
```

Fix it:

```bash
git remote set-url origin git@github-b:OWNER/REPO.git
```

Example:

```bash
git remote set-url origin git@github-b:jade-kenneth/ecommerce-app.git
```

Verify:

```bash
git remote -v
```

Push:

```bash
git push origin main
```

---

## Common Errors and Fixes

### Error: `fatal: protocol 'git:https' is not supported`

Fix:

Your remote URL is malformed. Set it correctly:

```bash
git remote set-url origin git@github-b:OWNER/REPO.git
```

### Error: `Invalid username or token` / `Password authentication is not supported`

Cause:

You're using HTTPS with a password.

Fix:

- Use SSH (recommended)
- Or use a Personal Access Token (PAT)

### Error: `Could not resolve hostname github-b`

Cause:

SSH alias not configured or config not saved.

Fix:

Ensure `~/.ssh/config` exists and contains:

```sshconfig
Host github-b
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github_b
  IdentitiesOnly yes
```

---

## Debug Commands

Check SSH config is loaded:

```bash
ssh -G github-b | head
```

Check which key is used:

```bash
ssh -vT git@github-b
```

Check remote:

```bash
git remote -v
```
