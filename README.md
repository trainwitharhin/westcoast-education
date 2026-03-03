# Westcoast Education — Kursplattform

Proof of Concept för Westcoast Educations moderna kursplattform. Byggd som en flersidig webbapplikation med publikt kursgalleri, bokningsflöde och administrationsgränssnitt.

---

## Kom igång

### Krav
- Node.js (v18+)
- npm

### Installation och start

```bash
# Installera beroenden
npm install

# Starta json-server (REST API på port 3000)
npm start

# Öppna index.html i din webbläsare via Live Server
# eller annan lokal dev-server (port spelar ingen roll)
```

> **OBS:** Både json-server och en lokal webbserver måste köras samtidigt för att applikationen ska fungera korrekt.

---

## Inloggning — Admin

Admin-panelen är skyddad med client-side autentisering.

| Fält | Värde |
|------|-------|
| E-post | `admin@westcoast.se` |
| Lösenord | `admin123` |

---

## Projektstruktur

```
/
├── index.html          # Publik kurslisting med filter och sökning
├── course.html         # Kursdetaljsida med bokningsmodal
├── admin.html          # Admin SPA (hash-baserad routing)
├── login.html          # Adminlösenordsskyddad inloggningssida
├── styles.css          # Komplett stylesheet (CSS custom properties)
├── db.json             # json-server databas (kurser + bokningar)
├── tsconfig.json       # TypeScript-konfiguration (target: ES2017)
├── package.json
├── js/
│   ├── api.js          # REST API-lager (getCourses, postBooking m.fl.)
│   ├── courses.js      # Publikt kursgalleri — filter, sökning, rendering
│   ├── course.js       # Kursdetaljsida — bokningsmodal och bekräftelse
│   └── admin.js        # Adminlogik — KPI, kurslistning, bokningar
└── src/
    ├── api.ts          # TypeScript-modul med interfaces och validering
    └── api.test.ts     # Jest-testsvit (16 testfall, TDD)
```

---

## Uppfyllda krav

### Steg 1 — Proof of Concept (Kurslisting + Bokning)

| Krav | Implementerat |
|------|--------------|
| Visa kurser attraktivt | ✅ Redaktionellt grid med featured-kort, typ-badges och beskrivning |
| Kurstitel | ✅ |
| Kursnummer | ✅ |
| Antal dagar | ✅ |
| Klassrum / Distans / On-Demand | ✅ Filtrerbart med färgkodade badges |
| Bokningssida med kundnamn | ✅ Modal med fullständigt formulär |
| Faktureringsadress | ✅ |
| E-postadress | ✅ |
| Mobilnummer | ✅ |

### Steg 2 — Administrationsverktyg

| Krav | Implementerat |
|------|--------------|
| Lägg till nya kurser | ✅ Formulär i admin → POST /courses |
| Kurstitel, kursnummer, antal dagar, kostnad | ✅ |
| Lista kunder per kurs | ✅ Bokningar grupperade per kurs med tabell |
| Kapacitetshantering | ✅ Max antal platser, bokade platser, statusbadge, progressbar |

---

## Teknisk implementation

### Tekniska krav

**Vanilla JavaScript**
All logik är skriven i ren JavaScript utan ramverk. Ingen jQuery, ingen Vue, ingen React.

**ES6-moduler**
Samtliga JS-filer använder `import`/`export`. `api.js` exporterar alla API-funktioner som konsumeras av respektive sidmodul.

```js
// api.js
export const getCourses   = () => request('/courses');
export const postBooking  = (booking) => post('/bookings', booking);
```

**json-server som REST API**
`db.json` hanteras av json-server. Applikationen kommunicerar uteslutande via HTTP mot `localhost:3000`.

| Endpoint | Metod | Användning |
|----------|-------|------------|
| `/courses` | GET | Hämta alla kurser |
| `/courses/:id` | GET | Hämta enskild kurs |
| `/courses` | POST | Skapa ny kurs |
| `/courses/:id` | PATCH | Uppdatera kapacitet |
| `/bookings` | GET | Hämta alla bokningar |
| `/bookings` | POST | Skapa ny bokning |

**DRY — Don't Repeat Yourself**
- `api.js` är ett centraliserat API-lager — ingen `fetch`-logik dupliceras
- `enrichCourses()` i `admin.js` beräknar kapacitetsstatus på ett ställe och används av KPI, kurslista och bokningslista
- CSS använder custom properties (`--accent`, `--radius`, `--sp-*`) konsekvent

**KISS — Keep It Simple Stupid**
- Hash-baserad router i `admin.html` är 30 rader ren JS utan bibliotek
- Ingen build-pipeline krävs — öppna HTML-filen direkt

---

## Arkitekturella beslut

**Hash-baserad SPA-routing i admin**
Admin-panelen är en Single Page Application i en enda HTML-fil med tre vyer (`#overview`, `#courses`, `#bookings`). `hashchange`-event hanterar navigation, vilket ger korrekt beteende för back/forward-knappar och direktlänkar.

**Kapacitetssystem**
`bookedCount` beräknas alltid *dynamiskt* från bokningsdata — det lagras aldrig separat. Detta eliminerar inkonsistenser mellan faktiska bokningar och visad data.

```
status = 'full'      → bookedCount >= capacity
status = 'filling'   → fillPct >= 75%
status = 'available' → öppna platser
status = 'unlimited' → ingen kapacitetsgräns satt
```

**Client-side autentisering**
Login-sidan (`login.html`) validerar credentials mot hårdkodade värden och sätter en `sessionStorage`-flagga. `admin.html` kontrollerar flaggan vid laddning och redirectar till `/login.html` om den saknas. Lämpligt för ett proof of concept utan backend.

---

## Sidor och flöde

```
index.html
  └─ Kursgalleri med filter (Classroom / Distance / On-Demand) och sökning
  └─ Klick på "View Course" → course.html?id=X

course.html?id=X
  └─ Kursdetaljer: titel, beskrivning, pris, längd, typ
  └─ "Book This Course" → modal med bokningsformulär
  └─ Bekräftelseskärm efter lyckad bokning

login.html
  └─ Inloggningsformulär → admin.html (vid godkända credentials)

admin.html
  ├─ #overview  → KPI-kort + senaste bokningar + snabbåtgärder
  ├─ #courses   → Skapa kurs + kurslista med kapacitetshantering
  ├─ #bookings  → Alla bokningar grupperade per kurs
  └─ #settings  → Plattformsinformation
```

---

## Testkörning

1. Starta servern: `npm start`
2. Öppna `index.html` via Live Server
3. Bläddra bland kurser, filtrera och sök
4. Klicka på en kurs → boka med testdata
5. Navigera till `login.html` → logga in med `admin@westcoast.se` / `admin123`
6. Verifiera att bokningen syns i admin under Bookings
7. Skapa en ny kurs i admin → verifiera att den dyker upp på framsidan

---

## TypeScript & TDD

TypeScript-modulen finns i `src/` och täcker kursvalidering med fullständig typning.

### Kör tester

```bash
npx jest
```

### Vad testas

`buildCoursePayload()` i `src/api.ts` är implementerad enligt TDD-principen:

| Kategori | Testfall |
|----------|----------|
| Happy path | Korrekt payload returneras, defaults sätts, whitespace trimmas, courseNumber normaliseras till uppercase |
| Titel | Tom sträng, enbart whitespace, för kort (< 2 tecken) |
| Dagar | 0 dagar, negativt tal, decimaltal |
| Pris | Negativt pris, gratis kurs (0 kr) godkänns |
| Kapacitet | Negativt tal, decimaltal, 0 = unlimited godkänns |

### Typer

```typescript
type CourseType = 'classroom' | 'distance' | 'ondemand'

interface Course {
  id, title, courseNumber, type, days, price, capacity, description
}

interface Booking {
  id, courseId, name, email, billingAddress, phone
}
```

`ValidationError` kastas med ett läsbart felmeddelande som kan visas direkt i UI:t.

---

## Kända buggar & åtgärder

Under utveckling identifierades och åtgärdades följande tekniska problem:

| Problem | Orsak | Åtgärd |
|---------|-------|--------|
| `Array.includes()` TS-fel | `tsconfig.json` saknades — TypeScript kände inte till ES2017-builtins | Skapade `tsconfig.json` med `target: ES2017`. Bytte även till `Set.has()` som är O(1) och target-oberoende |
| `db.json` — Expected array | `$schema`-nyckeln på rotnivå är en sträng — json-server kräver att alla rotnycklar är arrays | Tog bort `$schema`. Lade till saknade `type` och `capacity` på kursobjekten |
| CSS `truncate: ellipsis` | Påhittad property — finns inte i CSS-specen | Ersatt med korrekt trippel: `white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis` |
| CSS `-webkit-line-clamp` utan standard | Vendor-prefix utan motsvarande standardproperty | Lade till `line-clamp` utan prefix — stöds i Chrome 120+, Firefox 126+, Safari via `-webkit-` |