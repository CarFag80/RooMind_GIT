# 📱 Guida per Creare APK di Test - RooMind

## 🚀 Opzioni per Distribuire l'App ai Tester

### Opzione 1: EAS Build (Consigliata) ⭐

**EAS Build** è il servizio ufficiale di Expo per compilare app native. È la soluzione più semplice e affidabile.

#### Prerequisiti:
```bash
npm install -g @expo/cli
npm install -g eas-cli
```

#### Passaggi:

1. **Accedi al tuo account Expo:**
```bash
eas login
```

2. **Configura EAS Build:**
```bash
eas build:configure
```

3. **Compila l'APK per Android:**
```bash
eas build --platform android --profile preview
```

4. **Scarica l'APK:**
- Vai su [expo.dev](https://expo.dev) → I tuoi progetti
- Trova il build completato
- Scarica l'APK generato

#### Vantaggi:
- ✅ Processo automatizzato
- ✅ Build cloud (non serve Android Studio)
- ✅ APK ottimizzato per distribuzione
- ✅ Supporto per notifiche push e servizi nativi

---

### Opzione 2: Expo Development Build

Per test più avanzati con funzionalità native:

```bash
eas build --profile development --platform android
```

I tester dovranno installare **Expo Go** dall'Play Store e scansionare il QR code.

---

### Opzione 3: Build Locale (Avanzata)

Se preferisci compilare localmente:

#### Prerequisiti:
- Android Studio installato
- SDK Android configurato
- Java Development Kit (JDK)

#### Passaggi:

1. **Esporta il progetto:**
```bash
npx expo prebuild --platform android
```

2. **Compila con Gradle:**
```bash
cd android
./gradlew assembleRelease
```

3. **Trova l'APK in:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📋 Configurazione Pre-Build

### 1. Aggiorna `app.json`:

```json
{
  "expo": {
    "name": "RooMind",
    "slug": "roomind-app",
    "version": "1.0.0",
    "android": {
      "package": "com.yourname.roomind",
      "versionCode": 1,
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "buildToolsVersion": "34.0.0"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 2. Crea `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🧪 Distribuzione ai Tester

### Metodo 1: Link Diretto
- Carica l'APK su Google Drive, Dropbox o servizio simile
- Condividi il link con i tester
- I tester dovranno abilitare "Origini sconosciute" su Android

### Metodo 2: Firebase App Distribution
```bash
npm install -g firebase-tools
firebase appdistribution:distribute app-release.apk \
  --app your-app-id \
  --groups testers
```

### Metodo 3: TestFlight (iOS) / Google Play Console (Android)
- Carica su Google Play Console come "Internal Testing"
- Invita i tester tramite email

---

## ⚠️ Note Importanti

### Per i Tester Android:
1. **Abilita origini sconosciute:**
   - Impostazioni → Sicurezza → Origini sconosciute ✅

2. **Permessi richiesti:**
   - Storage (per salvare dati localmente)
   - Rete (se aggiungi funzionalità online future)

### Limitazioni Attuali:
- L'app usa **AsyncStorage** (funziona perfettamente su mobile)
- **DatePicker** potrebbe avere comportamenti diversi su Android/iOS
- Testare su diversi dispositivi e versioni Android

---

## 🔧 Risoluzione Problemi Comuni

### Build Fallisce:
```bash
# Pulisci cache
expo r -c
npm install
```

### APK Troppo Grande:
- Usa `--profile production` per build ottimizzato
- Abilita ProGuard in `android/app/build.gradle`

### Crash su Dispositivi Vecchi:
- Imposta `minSdkVersion: 21` in `app.json`
- Testa su dispositivi con Android 5.0+

---

## 📞 Supporto

Se incontri problemi durante il build:

1. **Documentazione Expo:** [docs.expo.dev](https://docs.expo.dev)
2. **Community Discord:** [expo.dev/discord](https://expo.dev/discord)
3. **Stack Overflow:** Tag `expo` e `react-native`

---

## 🎯 Raccomandazione Finale

**Per iniziare subito:** Usa **EAS Build** con il profilo `preview`. È la soluzione più veloce e affidabile per ottenere un APK funzionante da distribuire ai tuoi tester.

Il processo richiede circa 10-15 minuti per il primo build, poi i successivi saranno più veloci grazie alla cache.