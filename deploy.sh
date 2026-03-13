#!/bin/bash
# ============================================================
# deploy.sh — Backend Carlog
# Appelé par le cron job cPanel toutes les 5 minutes
# ============================================================

# Charger nvm pour avoir accès à node, npm, pm2
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

REPO="$HOME/carlog/carlog2.0"
LOG="$HOME/logs/deploy.log"

mkdir -p "$HOME/logs"

cd "$REPO" || { echo "[$(date)] ERROR: repo introuvable" >> "$LOG"; exit 1; }

# Snapshot du commit actuel
BEFORE=$(git rev-parse HEAD)

# Pull silencieux
git pull origin main --quiet 2>> "$LOG"

AFTER=$(git rev-parse HEAD)

# Si rien n'a changé → on s'arrête
if [ "$BEFORE" = "$AFTER" ]; then
    echo "[$(date)] Aucun changement." >> "$LOG"
    exit 0
fi

echo "[$(date)] Nouveaux commits détectés ($BEFORE → $AFTER), déploiement..." >> "$LOG"

# Installer les dépendances backend si package.json a changé
if git diff --name-only "$BEFORE" "$AFTER" | grep -q "backend/package"; then
    echo "[$(date)] package.json modifié, npm install..." >> "$LOG"
    cd backend && npm install --production --silent 2>> "$LOG"
    cd "$REPO"
fi

# Redémarrer PM2
pm2 restart carlog-api >> "$LOG" 2>&1

echo "[$(date)] Déploiement terminé." >> "$LOG"
