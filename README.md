# 🤖 Bot Discord Multifonctions

Un bot Discord avec système de tickets, salons vocaux privés, logs

## 📋 Table des matières

- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎫 Système de Tickets](#-système-de-tickets)
- [🎧 Système de Salons Vocaux](#-système-de-salons-vocaux)
- [📊 Système de Logs](#-système-de-logs)
- [🛠️ Commandes Utilitaires](#️-commandes-utilitaires)
- [📁 Structure du projet](#-structure-du-projet)
- [🔧 Développement](#-développement)

## 🚀 Installation

### Prérequis
- Node.js 18.0.0 ou plus récent
- npm
- Créé le bot sur [Discord Developer Portal](https://discord.com/developers/applications)

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/NathanSNB/DiscordjsBot.git
cd DiscordjsBot
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration**
Renommer `config exemple.json` en `config.json` et le completer

```

4. **Déployer les commandes slash**
```bash
node deploy-commands.js
```

5. **Lancer le bot**
```bash
node .
```

## ⚙️ Configuration

### Permissions requises pour le bot
- `Manage Channels` - Création/gestion des canaux
- `Manage Roles` - Gestion des permissions
- `Send Messages` - Envoi de messages
- `Embed Links` - Embeds
- `Attach Files` - Pièces jointes
- `Read Message History` - Historique des messages
- `View Audit Log` - Logs d'audit
- `Move Members` - Déplacer les membres vocaux
-OU
- `Administrator` - Donne toute les perms au bot

### Intents Discord
Le bot utilise les intents suivants :
- `Guilds`
- `GuildVoiceStates`
- `GuildMessages`
- `GuildMessageReactions`
- `MessageContent`
- `GuildMembers`
- `GuildBans`
- `GuildInvites`

## 🎫 Système de Tickets

### Configuration initiale
```
/ticketsetup
```
Cette commande crée automatiquement :
- 📁 Catégorie "Tickets"
- 🎫 Canal "créer-un-ticket" avec menu interactif
- 📋 Canal "ticket-logs" pour les logs
- 📦 Catégorie "Archives Tickets" pour l'archivage

### Gestion des raisons
```
/ticketreasons
```
Configure les raisons disponibles (jusqu'à 5) avec :
- Emoji personnalisé
- Label descriptif
- Description détaillée

### Commandes de gestion

#### 🔒 Fermeture de tickets
```
/ticketclose [raison] [force:true/false]
```
- Interface interactive avec boutons
- Fermeture rapide ou avec raison personnalisée
- Archivage automatique des conversations

```
/close [raison]
```
- Fermeture immédiate sans confirmation

#### 👥 Gestion des utilisateurs
```
/ticketadd @utilisateur
```
Ajoute un utilisateur au ticket actuel

```
/ticketrename [nouveau_nom]
```
Renomme le canal du ticket

#### 📊 Statistiques et maintenance
```
/ticketstats
```
Affiche les statistiques complètes :
- Tickets actifs/archivés
- État de la configuration
- Liste des tickets en cours

```
/ticketsync
```
Rafraîchit le menu de création de tickets

### Fonctionnalités automatiques
- **Archivage intelligent** : Sauvegarde complète des conversations
- **Logs détaillés** : Traçabilité de toutes les actions
- **Permissions dynamiques** : Accès automatique aux administrateurs
- **Interface intuitive** : Menus déroulants et boutons interactifs

## 🎧 Système de Salons Vocaux

### Configuration
```
/voicesetup
```
Crée automatiquement :
- 🗂️ Catégorie "Salons privés"
- ➕ Canal "Créer votre salon" (trigger automatique)

### Fonctionnement
1. **Création automatique** : Rejoindre le canal trigger crée un salon privé
2. **Panneau de contrôle** : Interface avec réactions pour personnaliser
3. **Suppression automatique** : Le salon se supprime quand il est vide

### Contrôles disponibles
- 🔒 **Verrouiller/Déverrouiller** : Contrôle l'accès au salon
- ✏️ **Renommer** : Change le nom du salon
- 👥 **Limite de membres** : Définit le nombre maximum (0-99)
- 👑 **Transfert de propriété** : Passe la gestion à un autre membre
- 🗑️ **Suppression** : Supprime le salon avec confirmation

### Fonctionnalités avancées
- **Permissions héritées** : Les admins gardent l'accès
- **Persistance** : Configuration sauvegardée automatiquement
- **Sécurité** : Seul le propriétaire peut gérer son salon

## 📊 Système de Logs

### Configuration
```
/logssetup [salon:optionnel]
```
- Crée automatiquement un canal `📋-logs` si non spécifié
- Configuration des permissions (invisible aux membres)

### Types d'événements surveillés

#### 🔧 Modération / Administration
- 👤 **Bannissements** : Qui, par qui, quand, pourquoi
- 🔄 **Débannissements** : Détails complets
- 🧹 **Suppression de messages** : Contenu, auteur, salon, modérateur
- ✏️ **Édition de messages** : Ancien/nouveau contenu

#### 📁 Gestion des membres
- ➕ **Arrivée de membres** : Pseudo, ID, invitation utilisée
- ➖ **Départ/Kick** : Détails et raison
- 🧑‍🎓 **Changements de pseudo** : Ancien → nouveau
- 🎭 **Modifications de rôles** : Ajouts/retraits détaillés
- 👑 **Boost du serveur** : Début/fin de boost

#### 📝 Gestion des salons & serveur
- 📚 **Création/suppression de salons** : Tous types
- ✏️ **Modifications de salons** : Nom, permissions, topic
- 🏷️ **Gestion des rôles** : Création, modification, suppression
- 🖼️ **Modifications du serveur** : Nom, icône, bannière

#### 🔗 Invitations
- ➕ **Création d'invitations** : Créateur, paramètres, expiration
- ➖ **Suppression d'invitations** : Qui a supprimé quoi

#### 📄 Posts de forum
- 📝 **Création de posts** : Auteur, titre, salon forum
- 🗑️ **Suppression de posts** : Modérateur, raison
- ✏️ **Modification de posts** : Changements détaillés

### Commandes de gestion

#### 📈 Statistiques
```
/logsstats
```
Affiche la configuration complète :
- État des systèmes
- Événements surveillés
- Canal configuré

#### 📋 Export des logs
```
/logsexport [durée] [unité:heures/jours]
```
Génère un fichier texte avec :
- Période personnalisable (1-720 heures ou 1-30 jours)
- Format lisible avec timestamps
- Statistiques d'export
- Téléchargement direct

**Exemples :**
- `/logsexport 24 heures` - Dernières 24h
- `/logsexport 7 jours` - Dernière semaine
- `/logsexport 30 jours` - Dernier mois

### Fonctionnalités avancées
- **Audit logs intégrés** : Récupération automatique des modérateurs
- **Format structuré** : Logs lisibles et organisés
- **Filtrage intelligent** : Événements pertinents uniquement
- **Performance optimisée** : Traitement asynchrone

## 🛠️ Commandes Utilitaires

### Informations
```
/ping
```
Teste la latence du bot

```
/help
```
Affiche la liste complète des commandes avec descriptions

### Administration
```
/reload [nom_commande]
```
Recharge une commande spécifique sans redémarrer le bot

## 📁 Structure du projet

```
discord-bot/
├── commands/                 # Commandes organisées par catégorie
│   ├── tickets/             # Système de tickets
│   │   ├── close.js         # Fermeture express
│   │   ├── ticketadd.js     # Ajout d'utilisateurs
│   │   ├── ticketclose.js   # Fermeture avec options
│   │   ├── ticketreasons.js # Configuration des raisons
│   │   ├── ticketrename.js  # Renommage
│   │   ├── ticketsetup.js   # Configuration initiale
│   │   ├── ticketstats.js   # Statistiques
│   │   └── ticketsync.js    # Rafraîchissement
│   ├── utility/             # Utilitaires généraux
│   │   ├── help.js          # Aide
│   │   ├── logsexport.js    # Export des logs
│   │   ├── logssetup.js     # Configuration logs
│   │   ├── logsstats.js     # Statistiques logs
│   │   ├── ping.js          # Test latence
│   │   └── reload.js        # Rechargement commandes
│   └── voice/               # Salons vocaux
│       └── voicesetup.js    # Configuration système vocal
├── data/                    # Données persistantes
│   ├── archived_tickets.json
│   ├── logs_config.json
│   ├── ticket_config.json
│   └── voice_config.json
├── events/                  # Gestionnaires d'événements
│   ├── channelCreate.js     # Création de salons
│   ├── channelDelete.js     # Suppression de salons
│   ├── guildBanAdd.js       # Bannissements
│   ├── guildBanRemove.js    # Débannissements
│   ├── guildMemberAdd.js    # Arrivée de membres
│   ├── guildMemberRemove.js # Départ de membres
│   ├── guildMemberUpdate.js # Modification de membres
│   ├── interactionCreate.js # Interactions (boutons, menus)
│   ├── inviteCreate.js      # Création d'invitations
│   ├── inviteDelete.js      # Suppression d'invitations
│   ├── messageDelete.js     # Suppression de messages
│   ├── messageReactionAdd.js# Réactions (système vocal)
│   ├── messageUpdate.js     # Édition de messages
│   ├── ready.js             # Démarrage du bot
│   ├── threadCreate.js      # Création de posts forum
│   ├── threadDelete.js      # Suppression de posts forum
│   ├── threadUpdate.js      # Modification de posts forum
│   └── voiceStateUpdate.js  # États vocaux
├── utils/                   # Classes utilitaires
│   ├── embedManager.js      # Gestion des embeds
│   ├── logsSystem.js        # Système de logs
│   ├── ticketSystem.js      # Système de tickets
│   └── voiceSystem.js       # Système vocal
├── config.json              # Configuration du bot
├── deploy-commands.js       # Déploiement des commandes
├── index.js                 # Point d'entrée
└── package.json             # Dépendances
```

#### Systèmes intégrés
- `client.ticketSystem` - Gestion des tickets
- `client.voiceSystem` - Gestion des salons vocaux
- `client.logsSystem` - Gestion des logs

## 🌟 Fonctionnalités avancées

### Persistance des données
- **Sauvegarde automatique** de toutes les configurations
- **Récupération** après redémarrage du bot
- **Format JSON** lisible et modifiable

### Gestion des erreurs
- **Logs détaillés** de toutes les erreurs
- **Messages d'erreur** utilisateur-friendly
- **Récupération gracieuse** en cas de problème

### Performance
- **Événements asynchrones** pour éviter les blocages
- **Cache intelligent** des données fréquemment utilisées
- **Optimisation** des requêtes Discord API

### Sécurité
- **Vérification des permissions** pour chaque action
- **Validation des entrées** utilisateur
- **Logs d'audit** pour traçabilité

## 📝 Notes importantes

- Certaines fonctionnalités nécessitent des **permissions spécifiques**
- Les **logs d'audit** peuvent être limités par Discord (30 jours)
- Le bot doit avoir les **intents** appropriés activés
- La **configuration** est sauvegardée dans le dossier `data/`

## 🆘 Support

Pour obtenir de l'aide ou signaler un bug :
1. Vérifiez les **logs du bot** dans la console
2. Consultez les **permissions** du bot sur le serveur
3. Ouvrez une **issue** sur GitHub avec les détails
4. Contacter; 💬 Discord : gitex_ ✉️ Mail : gitex68yt@gmail.com 

---

**Développé avec ❤️ par Gitex**

*Bot Discord multifonctions utilisant Discord.js v14*
