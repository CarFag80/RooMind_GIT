# RooMind - Gestione Camere d'Albergo

Un'app moderna per tenere traccia delle tue camere d'albergo durante i viaggi, costruita con React Native ed Expo.

## Caratteristiche

- **Gestione Camere**: Aggiungi, modifica ed elimina informazioni sulle camere
- **Ricerca Avanzata**: Trova rapidamente le tue camere per nome, numero, albergo
- **Date Soggiorno**: Traccia le date di check-in e check-out
- **Tipologie Camera**: Singola, doppia, tripla, suite con icone dedicate
- **Valutazioni**: Valuta i soggiorni passati con sistema a stelle
- **Notifiche Promemoria**: Avvisi automatici per check-in, check-out e valutazione
- **Prezzo per Notte**: Supporto multi-valuta (EUR, USD, GBP, CHF, JPY)
- **Storage Locale**: Tutti i dati salvati localmente sul dispositivo
- **Multi-piattaforma**: Funziona su iOS, Android e Web
- **Design Moderno**: Interfaccia Material Design 3
- **PWA Ready**: Installabile come app nativa su dispositivi mobili
- **Esportazione/Importazione**: Backup e ripristino dati in formato JSON

## Tecnologie Utilizzate

- **React Native** con **Expo SDK 52**
- **Expo Router** per la navigazione
- **TypeScript** per type safety
- **AsyncStorage** per persistenza dati
- **Lucide React Native** per le icone
- **Material Design 3** per il design system
- **PWA (Progressive Web App)** per l'installazione mobile

## Schermate

- **Home**: Visualizza tutte le camere salvate con statistiche e centro notifiche
- **Cerca**: Ricerca e filtra le camere per tipologia
- **Aggiungi**: Form completo per nuove camere con date, prezzo e valute
- **Modifica**: Modifica camere esistenti con validazione campi e valutazione
- **Impostazioni**: Gestione dati, notifiche, esportazione e importazione

## Installazione PWA

### Android
1. Apri l'app in Chrome
2. Tocca il banner "Installa RooMind" che appare
3. Oppure: Menu -> "Aggiungi alla schermata Home"

### iOS (Safari)
1. Apri l'app in Safari
2. Tocca il pulsante Condividi
3. Scorri e tocca "Aggiungi alla schermata Home"

### Desktop
1. Apri l'app in Chrome/Edge
2. Clicca sull'icona "Installa" nella barra degli indirizzi

## Installazione e Sviluppo

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

## Deploy su Netlify

L'app e configurata per il deploy automatico su Netlify:

1. **Configurazione automatica**: Il file `netlify.toml` gestisce build e redirects
2. **Build command**: `npm run build:web`
3. **Publish directory**: `dist`
4. **SPA Support**: Redirects configurati per Single Page Application

## Build Mobile

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

## Struttura del Progetto

```
app/
├── (tabs)/               # Tab navigation
│   ├── _layout.tsx       # Tab bar layout
│   ├── index.tsx         # Home screen
│   ├── search.tsx        # Search screen
│   ├── add.tsx           # Add room screen
│   └── settings.tsx      # Settings screen
├── edit-room.tsx         # Edit room screen
├── +not-found.tsx        # 404 screen
└── _layout.tsx           # Root layout

components/
├── Calendar.tsx          # Calendar component
├── DatePicker.tsx        # Custom date picker
├── DateRangePicker.tsx   # Date range picker
├── InfoModal.tsx         # Info modal component
├── NotificationCenter.tsx  # Notification center
├── NotificationSettings.tsx # Notification settings
├── NotificationTest.tsx  # Notification testing
├── PWAInstallPrompt.tsx  # PWA install banner
├── StarRating.tsx        # Star rating component
└── TripleRoomIcon.tsx    # Custom triple room icon

hooks/
└── useFrameworkReady.ts  # Framework initialization hook

services/
├── notificationService.ts # Notification scheduling and push
└── storage.ts            # AsyncStorage/localStorage service

types/
└── room.ts               # Room type definitions

public/
├── icons/                # PWA icons
├── manifest.json         # PWA manifest
└── sw.js                 # Service worker
```

## Configurazione

L'app non richiede variabili d'ambiente per funzionare. Tutti i dati sono salvati localmente.

Un file `.env.example` e disponibile come riferimento per futura integrazione backend opzionale.

## Features

### Completate

- [x] CRUD completo per camere
- [x] Ricerca e filtri
- [x] Date picker personalizzato e calendario
- [x] Date range picker (check-in/check-out)
- [x] Valutazioni a stelle per soggiorni passati
- [x] Prezzo per notte con multi-valuta
- [x] Notifiche promemoria (check-in, check-out, valutazione)
- [x] Centro notifiche con cronologia
- [x] Esportazione dati JSON
- [x] Importazione dati JSON
- [x] Design responsive
- [x] Gestione errori
- [x] Storage locale
- [x] Compatibilita web
- [x] PWA con installazione mobile
- [x] Icone adaptive per Android
- [x] Manifest completo
- [x] Prompt installazione intelligente
- [x] Service worker per notifiche background

## Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Distribuito sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## Supporto

Per problemi o domande:

1. Apri un issue su GitHub
2. Controlla la documentazione Expo
3. Consulta la community React Native

## Ringraziamenti

- **Expo Team** per l'eccellente framework
- **React Native Community** per le librerie
- **Material Design** per le linee guida UI
- **Lucide** per le icone

---

**RooMind v1.7** - Le tue camere, sempre con te
