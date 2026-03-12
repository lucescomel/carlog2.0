# Carlog — Guide de déploiement O2Switch + CI/CD

## 1. Prérequis O2Switch

### Accès SSH
O2Switch fournit un accès SSH sur tous ses plans. Se connecter :
```bash
ssh <user>@<server>.o2switch.net
```

### Vérifier Node.js
```bash
node -v   # >= 18 requis
npm -v
```

Si Node.js n'est pas dispo, l'activer via le gestionnaire de modules cPanel ou demander au support O2Switch.

### Installer PM2 (une seule fois)
```bash
npm install -g pm2
pm2 startup   # générer la commande systemd/init fournie, l'exécuter
```

---

## 2. Première installation manuelle

### 2.1 Cloner le dépôt
```bash
mkdir ~/carlog && cd ~/carlog
git clone git@github.com:<votre-user>/carlog.git .
```

### 2.2 Base de données MySQL
Dans cPanel → MySQL Databases :
- Créer une base : `carlog`
- Créer un utilisateur MySQL avec tous les droits sur cette base
- Importer le schéma :
```bash
mysql -u <user> -p carlog < database/schema.sql
```

### 2.3 Variables d'environnement
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Remplir toutes les valeurs (DB, JWT secrets, etc.).

Générer des secrets JWT forts :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2.4 Installer les dépendances backend
```bash
cd backend && npm ci --omit=dev && cd ..
```

### 2.5 Build frontend
```bash
cd frontend && npm ci && npm run build && cd ..
```

### 2.6 Démarrer l'appli avec PM2
Éditer `ecosystem.config.js` → adapter `cwd` au chemin absolu.
```bash
# Lancer en mode production
NODE_ENV=production pm2 start ecosystem.config.js --env production
pm2 save
```

### 2.7 Sous-domaine dans cPanel
Dans cPanel → Subdomains :
- Sous-domaine : `carlog`
- Domaine : `lucescomel.fr`
- Document root : `/home/<user>/carlog/frontend/dist`  ← NON (voir note)

> **Note** : L'app Express sert elle-même le frontend statique (fichiers dans `frontend/dist/`).
> Il faut donc **proxy** le sous-domaine vers le port Node.js (3001).

### 2.8 Proxy Apache vers Node.js
Dans cPanel → Apache Configuration (ou `.htaccess` dans le dossier du sous-domaine) :

```apache
# carlog.lucescomel.fr → Node.js:3001
<VirtualHost *:443>
    ServerName carlog.lucescomel.fr
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/
</VirtualHost>
```

Si pas d'accès à la config VirtualHost, utiliser un `.htaccess` dans le dossier du sous-domaine :
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]
```

---

## 3. GitHub Actions — Secrets à configurer

Dans le dépôt GitHub → Settings → Secrets → Actions :

| Secret            | Valeur                                              |
|-------------------|-----------------------------------------------------|
| `SSH_PRIVATE_KEY` | Clé SSH privée (RSA, générée localement)            |
| `SSH_HOST`        | Hostname O2Switch (ex: `node12.o2switch.net`)       |
| `SSH_USER`        | Votre login O2Switch (ex: `lucescob`)               |
| `DEPLOY_PATH`     | Chemin absolu sur le serveur (ex: `/home/lucescob/carlog`) |

### Générer la clé SSH (une seule fois)
```bash
# Sur votre machine locale
ssh-keygen -t ed25519 -C "carlog-deploy" -f ~/.ssh/carlog_deploy

# Copier la clé publique sur le serveur O2Switch
ssh-copy-id -i ~/.ssh/carlog_deploy.pub <user>@<server>.o2switch.net

# Copier le contenu de la clé privée → mettre dans SSH_PRIVATE_KEY
cat ~/.ssh/carlog_deploy
```

---

## 4. Flux CI/CD

```
push main
  └─> GitHub Actions
        ├─ npm ci (backend)
        ├─ npm ci + build (frontend)
        ├─ rsync backend → O2Switch
        ├─ rsync frontend/dist → O2Switch
        └─ ssh: npm ci --omit=dev && pm2 reload carlog-api
```

---

## 5. Variables d'environnement en production

Le fichier `.env` n'est **pas** versionné. Il doit être créé manuellement sur le serveur.
Il n'est **jamais** transmis par rsync (exclu explicitement).

---

## 6. Commandes utiles PM2

```bash
pm2 status               # état des processus
pm2 logs carlog-api      # logs en temps réel
pm2 reload carlog-api    # redémarrage 0-downtime
pm2 restart carlog-api   # redémarrage forcé
pm2 monit                # monitoring interactif
```
