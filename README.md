# 📱 RooMind - Gestione Camere d'Albergo

Un'app moderna per tenere traccia delle tue camere d'albergo durante i viaggi, costruita con React Native ed Expo.

## ✨ Caratteristiche

- 🏨 **Gestione Camere**: Aggiungi, modifica ed elimina informazioni sulle camere
- 🔍 **Ricerca Avanzata**: Trova rapidamente le tue camere per nome, numero, albergo
- 📅 **Date Soggiorno**: Traccia le date di check-in e check-out
- 🏷️ **Tipologie Camera**: Singola, doppia, suite con icone dedicate
- 💾 **Storage Locale**: Tutti i dati salvati localmente sul dispositivo
- 🌐 **Multi-piattaforma**: Funziona su iOS, Android e Web
- 🎨 **Design Moderno**: Interfaccia Material Design 3
- 📱 **PWA Ready**: Installabile come app nativa su dispositivi mobili

## 🚀 Tecnologie Utilizzate

- **React Native** con **Expo SDK 52**
- **Expo Router** per la navigazione
- **TypeScript** per type safety
- **AsyncStorage** per persistenza dati
- **Lucide React Native** per le icone
- **Material Design 3** per il design system
- **PWA (Progressive Web App)** per l'installazione mobile

## 📱 Schermate

- **Home**: Visualizza tutte le camere salvate con statistiche
- **Cerca**: Ricerca e filtra le camere per tipologia
- **Aggiungi**: Form completo per nuove camere
- **Impostazioni**: Gestione dati ed esportazione

## 📱 Installazione PWA

### Android
1. Apri https://roomind.netlify.app in Chrome
2. Tocca il banner "Installa RooMind" che appare
3. Oppure: Menu → "Aggiungi alla schermata Home"
4. L'app sarà disponibile come app nativa

### iOS (Safari)
1. Apri https://roomind.netlify.app in Safari
2. Tocca il pulsante Condividi ⬆️
3. Scorri e tocca "Aggiungi alla schermata Home"
4. Tocca "Aggiungi" per confermare

### Desktop
1. Apri https://roomind.netlify.app in Chrome/Edge
2. Clicca sull'icona "Installa" nella barra degli indirizzi
3. L'app sarà disponibile come applicazione desktop

## 🛠️ Installazione e Sviluppo

### Prerequisiti

- Node.js 18+
- npm o yarn
- Expo CLI

### Setup Locale

```bash
# Clona il repository
git clone <repository-url>
cd roomind-app

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

### Build per Web

```bash
# Build per produzione web
npm run build:web

# Preview del build
npm run preview
```

## 🌐 Deploy su Netlify

L'app è configurata per il deploy automatico su Netlify:

1. **Configurazione automatica**: Il file `netlify.toml` gestisce build e redirects
2. **Build command**: `npm run build:web`
3. **Publish directory**: `dist`
4. **SPA Support**: Redirects configurati per Single Page Application

### Deploy Steps

1. Connetti il repository a Netlify
2. Le impostazioni di build sono già configurate
3. Deploy automatico ad ogni push su main

## 📱 Build Mobile

Per creare APK/IPA per test:

```bash
# Installa EAS CLI
npm install -g @expo/cli eas-cli

# Login Expo
eas login

# Configura build
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview
```

## 🏗️ Struttura del Progetto

```
app/
├── (tabs)/           # Tab navigation
│   ├── index.tsx     # Home screen
│   ├── search.tsx    # Search screen
│   ├── add.tsx       # Add room screen
│   └── settings.tsx  # Settings screen
├── edit-room.tsx     # Edit room screen
└── _layout.tsx       # Root layout

components/
├── DatePicker.tsx    # Custom date picker
└── InfoModal.tsx     # Info modal component

services/
└── storage.ts        # AsyncStorage service

types/
└── room.ts          # Room type definitions
```

## 🔧 Configurazione

### Environment Variables

Crea un file `.env` per configurazioni locali:

```env
EXPO_PUBLIC_APP_NAME=RooMind
EXPO_PUBLIC_VERSION=1.0.0
```

### Platform-Specific Code

L'app gestisce automaticamente le differenze tra piattaforme:

```typescript
import { Platform } from 'react-native';

// Esempio di codice platform-specific
if (Platform.OS === 'web') {
  // Logica specifica per web
} else {
  // Logica per mobile
}
```

## 📊 Features Implementate

### ✅ Completate

- [x] CRUD completo per camere
- [x] Ricerca e filtri
- [x] Date picker personalizzato
- [x] Export dati JSON
- [x] Design responsive
- [x] Gestione errori
- [x] Storage locale
- [x] Compatibilità web
- [x] PWA con installazione mobile
- [x] Icone adaptive per Android
- [x] Manifest completo
- [x] Prompt installazione intelligente

### 🔄 In Sviluppo

- [ ] Sincronizzazione cloud
- [ ] Notifiche promemoria
- [ ] Condivisione camere
- [ ] Backup automatico

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## 🆘 Supporto

Per problemi o domande:

1. Apri un issue su GitHub
2. Controlla la documentazione Expo
3. Consulta la community React Native

## 🙏 Ringraziamenti

- **Expo Team** per l'eccellente framework
- **React Native Community** per le librerie
- **Material Design** per le linee guida UI
- **Lucide** per le bellissime icone

---

**RooMind v1.0** - Le tue camere, sempre con te 🏨✨