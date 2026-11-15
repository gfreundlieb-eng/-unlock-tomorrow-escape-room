// =====================================================================
//  INHALTE – Das Geheimnis der ersten Stadt
//  Alle Texte sind Lerntexte für Klasse 6. Es werden KEINE erfundenen
//  Texte als historische Originalquellen ausgegeben. Die Forscherin
//  „Dr. Mila Ostermann“ ist eine erfundene Spielfigur.
// =====================================================================

const GAME_TITLE = 'Das Geheimnis der ersten Stadt';
const SAVE_KEY = 'erste-stadt-v1';

const ROOMS = [
  { id: 'r1', name: 'Die Zeitkammer', symbol: 'faustkeil', symbolName: 'Faustkeil', digit: 3,
    color: '#7fb7ff',
    puzzles: ['r1_timeline', 'r1_sort', 'r1_clock'],
    intro: 'In dieser Kammer ist die Zeit durcheinandergeraten. An der Wand liegt ein zerbrochener Zeitstrahl, in der Mitte steht ein riesiges Zeitrad. Bringt Ordnung in die Geschichte der Steinzeit!' },
  { id: 'r2', name: 'Das Forscherlager', symbol: 'pinsel', symbolName: 'Forscherpinsel', digit: 8,
    color: '#ffcf6e',
    puzzles: ['r2_dig', 'r2_layers', 'r2_sources', 'r2_crate'],
    intro: 'Ihr steht im Lager der Archäologin Dr. Mila Ostermann (eine erfundene Spielfigur). Sie ist verschwunden – aber ihre Grabung, ihre Funde und ihr Notizbuch sind noch da. Arbeitet wie echte Forscherinnen und Forscher!' },
  { id: 'r3', name: 'Die Höhle von Lascaux', symbol: 'pferd', symbolName: 'Höhlenpferd', digit: 1,
    color: '#ff9a62',
    puzzles: ['r3_search', 'r3_count', 'r3_obs', 'r3_paint'],
    intro: 'Es ist stockdunkel. Nur eure Fackel leuchtet. An den Wänden dieser Höhle haben Menschen vor etwa 17.000 Jahren Tiere gemalt. Untersucht die Bilder genau!' },
  { id: 'r4', name: 'Das jungsteinzeitliche Dorf', symbol: 'aehre', symbolName: 'Getreideähre', digit: 6,
    color: '#9ee07a',
    puzzles: ['r4_explore', 'r4_compare', 'r4_bread', 'r4_cloze'],
    intro: 'Ihr tretet hinaus ins Licht: Vor euch liegt ein Dorf mit Langhäusern, Feldern und Tieren. Hier leben Menschen um 5000 v. Chr. Was hat sich im Vergleich zu den Jägern und Sammlern verändert?' }
];

// Reihenfolge der Täfelchen am Tor: von alt nach jung
const GATE_CODE = '3168'; // Faustkeil (3) – Höhlenpferd (1) – Getreideähre (6) – Forscherpinsel (8)

const STORY = [
  { title: 'Die Höhle', text: 'Bei einem Ausflug entdeckt eure Klasse hinter einem Felsspalt eine geheimnisvolle Höhle. Fackeln flackern an den Wänden. Es riecht nach Rauch und feuchtem Stein.' },
  { title: 'Das Tor', text: 'Am Ende der Höhle steht ein riesiges Steintor. Darauf sind vier leere Mulden zu sehen. Darunter steht: „Wer die Steinzeit versteht, findet den Weg in die erste Stadt.“' },
  { title: 'Eure Mission', text: 'Vier Gänge führen zu vier Kammern. In jeder Kammer wartet ein Rätsel aus der Geschichte. Für jede gelöste Kammer bekommt ihr ein Steintäfelchen mit einer Zahl. Mit allen vier Täfelchen öffnet ihr das Tor.' }
];

const LEVELS = {
  entdecker: { name: 'Entdecker', desc: 'Weniger Karten, mehr Hilfen, falsche Antworten werden markiert.' },
  experten: { name: 'Experten', desc: 'Mehr Karten, schwierigere Aufgaben, weniger Rückmeldung.' }
};

// ---------------------------------------------------------------------
//  INFO-KARTEN (Erkundung, Hinweise)
// ---------------------------------------------------------------------
const INFOS = {
  hub_help: { title: 'So bewegt ihr euch', text: '<ul><li><b>Wischen</b> (mit einem Finger ziehen): umsehen.</li><li><b>Auf den Boden tippen</b>: dorthin gehen.</li><li><b>Auf Gegenstände oder Zeichen tippen</b>: untersuchen. Ist etwas weit weg, lauft ihr automatisch hin.</li><li>Goldene Zeichen <span class="mk mk-todo">!</span> sind Rätsel, blaue <span class="mk mk-info">i</span> sind Infos, grüne <span class="mk mk-done">✓</span> habt ihr geschafft.</li><li>Im <b>Forscherbuch</b> oben seht ihr euren Fortschritt. Dort könnt ihr auch direkt zu jedem Rätsel gehen.</li></ul>' },
  r1_info: { title: 'Was ist die Steinzeit?', text: '<p>Die <b>Steinzeit</b> ist der längste Abschnitt der Menschheitsgeschichte. Sie heißt so, weil die Menschen ihre wichtigsten Werkzeuge aus <b>Stein</b> herstellten – aber auch aus Holz, Knochen und Geweih.</p><p>Man teilt sie grob ein in:</p><ul><li><b>Altsteinzeit</b> (ab ca. 2,5 Mio. Jahren bis ca. 10.000 v. Chr.): Menschen leben als Jäger und Sammler.</li><li><b>Jungsteinzeit</b> (im Vorderen Orient ab ca. 9.500 v. Chr., bei uns ab ca. 5.300 v. Chr.): Menschen werden Bauern und sesshaft.</li></ul><p class="small">Dazwischen liegt in Europa noch die Mittelsteinzeit.</p><p class="small"><b>Rechentrick:</b> Jahre „v. Chr.“ + etwa 2.000 = so viele Jahre ist es her. Beispiel: 3.000 v. Chr. ist etwa 5.000 Jahre her.</p>' },
  r2_info: { title: 'Notizbuch von Dr. Ostermann', text: '<p class="note">„Archäologen graben vorsichtig Schicht für Schicht aus. Jeder Fund bekommt einen <b>Fundzettel</b>. Wir schreiben auf, <i>wo</i> und in <i>welcher Schicht</i> wir ihn gefunden haben.“</p><p class="small">Dieses Notizbuch ist ein Lerntext im Spiel – keine echte historische Quelle.</p>' },
  r3_info: { title: 'Gut zu wissen: Lascaux', text: '<p>Die Höhle von <b>Lascaux</b> liegt in Südfrankreich. Vier Jugendliche haben sie <b>1940</b> entdeckt. An den Wänden gibt es fast 2.000 Bilder und Ritzzeichnungen, vor allem von Tieren. Sie sind etwa <b>17.000 Jahre</b> alt.</p><p>Weil der Atem und die Wärme vieler Besucher den Bildern schadeten, ist die echte Höhle seit <b>1963 geschlossen</b>. Besucher sehen heute eine genaue <b>Nachbildung</b> (Rekonstruktion).</p><p class="small">Die Bilder in diesem Spiel sind vereinfachte Nachzeichnungen, keine Fotos der Originale.</p>' },
  r4_info: { title: 'Willkommen im Dorf', text: '<p>So ähnlich wie hier könnte ein Dorf der ersten Bauern in Mitteleuropa um 5000 v. Chr. ausgesehen haben. Forscher nennen diese Menschen nach dem Muster auf ihren Tontöpfen die <b>Bandkeramiker</b>.</p><p class="small">Das 3D-Dorf ist eine vereinfachte Rekonstruktion nach archäologischen Funden.</p>' },
  // Erkundung Dorf (r4_explore)
  x_haus: { title: 'Das Langhaus', text: '<p>Die ersten Bauern bauten große <b>Langhäuser</b> – oft über 20 Meter lang. Das Gerüst bestand aus Holzpfosten, die Wände aus Flechtwerk mit Lehm, das Dach aus Schilf oder Stroh.</p><p>Von den Häusern ist nur wenig übrig: Archäologen finden die dunklen Verfärbungen der <b>Pfostenlöcher</b> im Boden. Daraus können sie den Grundriss erschließen.</p>',
    check: { q: 'Woran erkennen Archäologen heute, wo ein Langhaus stand?', options: [{ t: 'An den Spuren der Pfostenlöcher im Boden', ok: true }, { t: 'An den gut erhaltenen Holzwänden', ok: false }] } },
  x_feld: { title: 'Das Getreidefeld', text: '<p>Die Bauern bauten Getreide an, zum Beispiel <b>Emmer</b> und <b>Einkorn</b> (alte Weizenarten), außerdem Erbsen, Linsen und Lein (Flachs).</p><p>Ein Feld musste man pflegen, schützen und abernten. Deshalb blieben die Menschen an einem Ort: Sie wurden <b>sesshaft</b>.</p>',
    check: { q: 'Warum wurden die Bauern sesshaft?', options: [{ t: 'Weil sie bei ihren Feldern bleiben mussten', ok: true }, { t: 'Weil es keine Tiere zum Jagen mehr gab', ok: false }] } },
  x_tiere: { title: 'Der Tierpferch', text: '<p>Die Bauern hielten <b>Haustiere</b>: Rinder, Schafe, Ziegen und Schweine. Diese Tiere stammen von wilden Vorfahren ab und wurden über viele Generationen gezähmt und gezüchtet.</p><p>Die Tiere lieferten Fleisch, Milch, Fell, Leder und Knochen für Werkzeuge. Das nennt man <b>Viehhaltung</b>.</p>',
    check: { q: 'Was bedeutet „Viehhaltung“?', options: [{ t: 'Menschen halten und züchten Tiere, um sie zu nutzen', ok: true }, { t: 'Menschen folgen wilden Tierherden', ok: false }] } },
  x_speicher: { title: 'Vorräte', text: '<p>Bauern ernten im Sommer – aber essen müssen sie das ganze Jahr. Deshalb legten sie <b>Vorräte</b> an: in Gruben, Körben und in <b>Tongefäßen</b>.</p><p>Die Töpfe der ersten Bauern bei uns sind oft mit Linien und Bändern verziert. Deshalb heißen diese Menschen <b>Bandkeramiker</b>.</p>',
    check: { q: 'Warum brauchten die Bauern Vorräte?', options: [{ t: 'Damit sie auch im Winter genug zu essen hatten', ok: true }, { t: 'Damit sie ihre Töpfe verkaufen konnten', ok: false }] } },
  x_brunnen: { title: 'Der Brunnen', text: '<p>Ein Dorf braucht Wasser für Menschen, Tiere und zum Kochen. Die Bauern bauten deshalb auch <b>Brunnen</b> aus Holz.</p><p>In <b>Erkelenz-Kückhoven</b> (NRW) haben Archäologen einen Holzbrunnen aus der Zeit um 5100 v. Chr. gefunden. Er gehört zu den ältesten erhaltenen Holzbauten der Welt.</p>',
    check: { q: 'Wo wurde einer der ältesten Holzbrunnen der Welt gefunden?', options: [{ t: 'In Erkelenz in Nordrhein-Westfalen', ok: true }, { t: 'In der Höhle von Lascaux', ok: false }] } },
  x_werkstatt: { title: 'Webstuhl und Töpferplatz', text: '<p>Im Dorf wurde viel hergestellt: Aus Ton formte man <b>Töpfe</b> und brannte sie im Feuer. Aus den Fasern der Flachspflanze spann man Fäden und <b>webte</b> daraus Stoffe (Leinen).</p><p>Werkzeuge wie das <b>geschliffene Steinbeil</b> brauchte man, um Bäume zu fällen und Holz zu bearbeiten.</p>',
    check: { q: 'Woraus webten die ersten Bauern Stoffe?', options: [{ t: 'Aus den Fasern der Flachspflanze', ok: true }, { t: 'Aus Plastikfäden', ok: false }] } },

  // Erkundung Uruk (u_explore)
  u_landwirtschaft: { title: 'Landwirtschaft', text: '<p>Rund um Uruk lagen große Felder. Die Bauern bauten vor allem <b>Gerste</b> an, außerdem Weizen, Linsen und Zwiebeln. Dazu kamen <b>Dattelpalmen</b> und große Herden von Schafen und Ziegen.</p><p>Der Boden am Fluss war sehr fruchtbar. Die Bauern ernteten oft <b>mehr, als sie selbst brauchten</b>. Das nennt man einen <b>Überschuss</b>.</p>',
    check: { q: 'Was bedeutet „Überschuss“?', options: [{ t: 'Es gibt mehr Nahrung, als die Bauern selbst brauchen', ok: true }, { t: 'Die Ernte ist ausgefallen', ok: false }] } },
  u_bewaesserung: { title: 'Bewässerung', text: '<p>Uruk lag im Süden <b>Mesopotamiens</b>, dem „Land zwischen den Flüssen“ Euphrat und Tigris. Dort regnet es sehr wenig. Ohne Wasser wächst kaum etwas.</p><p>Die Menschen gruben deshalb <b>Kanäle</b> und leiteten das Wasser des Euphrats auf ihre Felder. Für den Bau und die Pflege der Kanäle mussten viele Menschen zusammenarbeiten.</p>',
    check: { q: 'Warum bauten die Menschen Kanäle?', options: [{ t: 'Weil es wenig regnete und die Felder Wasser brauchten', ok: true }, { t: 'Damit sie im Kanal baden konnten', ok: false }] } },
  u_arbeitsteilung: { title: 'Arbeitsteilung', text: '<p>Weil die Bauern genug Nahrung für viele herstellten, mussten nicht mehr alle Menschen auf dem Feld arbeiten. Es gab <b>Töpfer</b>, <b>Weber</b>, <b>Metallhandwerker</b>, Händler, Schreiber und Priester.</p><p>Die Töpfer in Uruk benutzten schon die <b>Töpferscheibe</b>. So konnten sie sehr viele Gefäße schnell herstellen. Jeder macht das, was er gut kann – das nennt man <b>Arbeitsteilung</b>.</p>',
    check: { q: 'Was ist Arbeitsteilung?', options: [{ t: 'Menschen spezialisieren sich auf verschiedene Berufe', ok: true }, { t: 'Alle Menschen machen genau dieselbe Arbeit', ok: false }] } },
  u_handel: { title: 'Handel', text: '<p>In Mesopotamien gab es fruchtbaren Boden, aber kaum <b>Holz</b>, <b>Steine</b> und <b>Metalle</b>. Diese Waren holten Händler aus fernen Gegenden – den blauen Schmuckstein <b>Lapislazuli</b> sogar aus dem heutigen Afghanistan.</p><p>Im Tausch boten sie Getreide, Stoffe und Handwerkswaren an.</p>',
    check: { q: 'Warum war Handel für Uruk wichtig?', options: [{ t: 'Rohstoffe wie Holz, Stein und Metall fehlten', ok: true }, { t: 'In Uruk gab es zu viel Holz', ok: false }] } },
  u_verwaltung: { title: 'Verwaltung', text: '<p>In großen Speichern lagerten Getreide, Öl und Stoffe. Die Bauern mussten einen Teil ihrer Ernte als <b>Abgabe</b> an den Tempel liefern. Arbeiter bekamen dafür Essensrationen.</p><p>Damit niemand den Überblick verlor, wurde alles genau <b>verwaltet</b>: Beamte zählten die Waren und kennzeichneten Behälter mit <b>Rollsiegeln</b>.</p>',
    check: { q: 'Warum brauchte die Stadt eine Verwaltung?', options: [{ t: 'Um Vorräte, Abgaben und Arbeit zu organisieren', ok: true }, { t: 'Um Höhlenbilder zu malen', ok: false }] } },
  u_schrift: { title: 'Schrift', text: '<p>Um sich all die Abgaben und Vorräte zu merken, ritzten Schreiber in Uruk um 3300–3200 v. Chr. Zeichen in feuchte <b>Tontafeln</b>. Zuerst waren es kleine Bilder und Zahlzeichen.</p><p>Später drückte man die Zeichen mit einem Griffel aus Schilfrohr ein. Sie sahen aus wie kleine Keile – deshalb heißt diese Schrift <b>Keilschrift</b>. Die ältesten Tafeln sind vor allem <b>Listen</b> von Waren.</p>',
    check: { q: 'Wofür wurde die Schrift zuerst vor allem benutzt?', options: [{ t: 'Für Listen über Waren und Vorräte', ok: true }, { t: 'Für Abenteuerromane', ok: false }] } },
  u_bauwerke: { title: 'Große Bauwerke', text: '<p>Im Zentrum von Uruk standen gewaltige <b>Tempel</b> aus Lehmziegeln. Einer von ihnen, der „Weiße Tempel“, stand auf einer hohen Terrasse. Solche Terrassen waren Vorläufer der späteren <b>Zikkurate</b> (Stufentürme).</p><p>Für so große Bauten brauchte man viele Arbeiter, Baumeister und eine gute Planung. Forscher schätzen, dass um 3000 v. Chr. vielleicht 40.000 Menschen in Uruk lebten.</p><p class="small">Die Gebäude im Spiel sind vereinfachte Rekonstruktionen.</p>',
    check: { q: 'Was war nötig, um so große Tempel zu bauen?', options: [{ t: 'Viele Arbeiter und eine gute Planung', ok: true }, { t: 'Ein einzelner Bauer an einem Nachmittag', ok: false }] } },
  uruk_intro: { title: 'Uruk – um 3200 v. Chr.', text: '<p>Das Tor ist offen! Ihr steht in <b>Uruk</b> in Mesopotamien (heute im Irak). Uruk gilt als eine der <b>ersten Städte</b> der Welt.</p><p>Erkundet die Stadt und findet die <b>sieben Merkmale</b>, die Uruk von einem Bauerndorf unterscheiden. Dann könnt ihr die große Frage am Stadtplatz beantworten.</p><p class="small">So könnte Uruk ausgesehen haben – eine vereinfachte Rekonstruktion.</p>' }
};

// ---------------------------------------------------------------------
//  RÄTSEL
//  Jedes Rätsel hat gemeinsame Daten und Daten je Schwierigkeitsstufe
//  (entdecker / experten). hints: [Tipp 1, Tipp 2, Lösung]
// ---------------------------------------------------------------------
const PUZZLES = {
  // ============================ RAUM 1 ==============================
  r1_timeline: {
    room: 'r1', title: 'Der zerbrochene Zeitstrahl', kind: 'Reihenfolge',
    type: 'place', layout: 'sequence', ends: ['früher', 'später'],
    entdecker: {
      intro: 'Die Steine des Zeitstrahls sind durcheinandergeraten. Legt die Ereignisse in die richtige Reihenfolge: <b>oben das älteste, unten das jüngste</b>.',
      items: [
        { id: 'a', text: 'Frühmenschen stellen die ersten Steinwerkzeuge her', sub: 'vor ca. 2,5 Millionen Jahren' },
        { id: 'b', text: 'Menschen malen Tiere an die Wände der Höhle von Lascaux', sub: 'vor ca. 17.000 Jahren' },
        { id: 'c', text: 'Im Fruchtbaren Halbmond werden Menschen zu Bauern', sub: 'um 9.500 v. Chr. (vor ca. 11.500 Jahren)' },
        { id: 'd', text: 'Uruk in Mesopotamien wird zu einer großen Stadt', sub: 'um 3.500 v. Chr. (vor ca. 5.500 Jahren)' },
        { id: 'e', text: 'In Mesopotamien entsteht die Schrift', sub: 'um 3.200 v. Chr. (vor ca. 5.200 Jahren)' }
      ],
      order: ['a', 'b', 'c', 'd', 'e'],
      hints: [
        'Achtet auf die Zahlen in grauer Schrift. Je größer die Zahl der Jahre „vor heute“, desto länger ist es her.',
        'Ganz oben gehören die Steinwerkzeuge (vor 2,5 Millionen Jahren). Die Schrift ist das jüngste Ereignis.',
        'Richtig ist: Steinwerkzeuge → Lascaux → erste Bauern → Uruk wird Stadt → Schrift.'
      ]
    },
    experten: {
      intro: 'Die Steine des Zeitstrahls sind durcheinandergeraten. Legt die Ereignisse in die richtige Reihenfolge: <b>oben das älteste, unten das jüngste</b>. Vorsicht: Manche Daten stehen in „Jahren vor heute“, andere in „v. Chr.“',
      items: [
        { id: 'a', text: 'Frühmenschen stellen die ersten Steinwerkzeuge her', sub: 'vor ca. 2,5 Millionen Jahren' },
        { id: 'b', text: 'Die letzten Neandertaler sterben aus', sub: 'vor ca. 40.000 Jahren' },
        { id: 'c', text: 'Menschen malen Tiere an die Wände der Höhle von Lascaux', sub: 'vor ca. 17.000 Jahren' },
        { id: 'd', text: 'Im Fruchtbaren Halbmond werden Menschen zu Bauern', sub: 'um 9.500 v. Chr.' },
        { id: 'e', text: 'Die ersten Bauern leben im Rheinland (NRW)', sub: 'um 5.300 v. Chr.' },
        { id: 'f', text: 'Uruk in Mesopotamien wird zu einer großen Stadt', sub: 'um 3.500 v. Chr.' },
        { id: 'g', text: 'In Mesopotamien entsteht die Schrift', sub: 'um 3.200 v. Chr.' }
      ],
      order: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      hints: [
        'Rechnet alle Daten in „Jahre vor heute“ um: Jahre v. Chr. + etwa 2.000. Beispiel: 9.500 v. Chr. ist etwa 11.500 Jahre her.',
        'Lascaux (vor 17.000 Jahren) ist älter als die ersten Bauern (vor ca. 11.500 Jahren). Bei „v. Chr.“ gilt: Die größere Zahl ist früher.',
        'Richtig ist: Steinwerkzeuge → Neandertaler sterben aus → Lascaux → Bauern im Fruchtbaren Halbmond → Bauern im Rheinland → Uruk wird Stadt → Schrift.'
      ]
    },
    success: 'Der Zeitstrahl leuchtet! Die Steinzeit war sehr lang: Über 2 Millionen Jahre lebten Menschen als Jäger und Sammler. Erst vor etwa 11.500 Jahren wurden die ersten Menschen zu Bauern.'
  },

  r1_sort: {
    room: 'r1', title: 'Alt oder jung?', kind: 'Zuordnung',
    type: 'place', layout: 'bins',
    slots: [
      { id: 'alt', label: 'Altsteinzeit', sub: 'Jäger und Sammler' },
      { id: 'jung', label: 'Jungsteinzeit', sub: 'Bauern' }
    ],
    entdecker: {
      intro: 'In zwei Körben sollen die Dinge der Altsteinzeit und der Jungsteinzeit liegen. Sortiert die Karten in den richtigen Korb.',
      items: [
        { id: 'a', text: 'Jagd auf Mammut und Rentier', to: 'alt' },
        { id: 'b', text: 'Faustkeil aus Feuerstein', to: 'alt' },
        { id: 'c', text: 'Umherziehen und in Zelten wohnen', to: 'alt' },
        { id: 'd', text: 'Getreide anbauen', to: 'jung' },
        { id: 'e', text: 'Vorratstöpfe aus Ton', to: 'jung' },
        { id: 'f', text: 'Langhäuser in einem Dorf', to: 'jung' }
      ],
      hints: [
        'Fragt euch bei jeder Karte: Braucht man dafür ein Feld oder ein festes Dorf? Dann gehört sie zur Jungsteinzeit.',
        'Jäger und Sammler mussten alles tragen können. Schwere Tontöpfe und große Häuser passen nicht dazu.',
        'Altsteinzeit: Mammutjagd, Faustkeil, Zelte. Jungsteinzeit: Getreide, Tontöpfe, Langhäuser.'
      ]
    },
    experten: {
      intro: 'In zwei Körben sollen die Dinge der Altsteinzeit und der Jungsteinzeit liegen. Sortiert alle Karten in den richtigen Korb.',
      items: [
        { id: 'a', text: 'Jagd auf Mammut und Rentier', to: 'alt' },
        { id: 'b', text: 'Faustkeil aus Feuerstein', to: 'alt' },
        { id: 'c', text: 'Umherziehen und in Zelten wohnen', to: 'alt' },
        { id: 'g', text: 'Speerschleuder für die Jagd', to: 'alt' },
        { id: 'h', text: 'Tierbilder in Höhlen wie Lascaux', to: 'alt' },
        { id: 'd', text: 'Getreide anbauen', to: 'jung' },
        { id: 'e', text: 'Vorratstöpfe aus Ton', to: 'jung' },
        { id: 'f', text: 'Langhäuser in einem Dorf', to: 'jung' },
        { id: 'i', text: 'Ziegen, Schafe und Rinder halten', to: 'jung' },
        { id: 'j', text: 'Geschliffenes Steinbeil zum Bäumefällen', to: 'jung' }
      ],
      hints: [
        'Fragt euch bei jeder Karte: Gehört sie zu einem Leben als Jäger und Sammler oder zu einem Leben als sesshafte Bauern?',
        'Achtung: Die Höhlenbilder von Lascaux sind ca. 17.000 Jahre alt – damals gab es noch keine Bauern. Das geschliffene Steinbeil brauchten die Bauern, um Wald für Felder zu roden.',
        'Altsteinzeit: Mammutjagd, Faustkeil, Zelte, Speerschleuder, Höhlenbilder. Jungsteinzeit: Getreide, Tontöpfe, Langhäuser, Haustiere, geschliffenes Steinbeil.'
      ]
    },
    success: 'Richtig sortiert! In der Altsteinzeit lebten die Menschen als Jäger und Sammler und zogen umher. In der Jungsteinzeit bauten sie Getreide an, hielten Tiere und lebten in Dörfern.'
  },

  r1_clock: {
    room: 'r1', title: 'Das Zeitrad', kind: 'Schlussfolgerung',
    entdecker: {
      type: 'choice',
      intro: '<p>Auf dem Zeitrad steht: <i>„Stell dir vor, die ganze Geschichte der Menschen passt in <b>einen einzigen Tag</b>. Um 0:00 Uhr stellen die ersten Menschen Steinwerkzeuge her (vor 2,5 Millionen Jahren). Um 24:00 Uhr ist heute.“</i></p><p class="small">Jede Minute auf dieser Uhr steht für etwa 1.700 Jahre.</p>',
      clock: true,
      questions: [
        { q: 'Um wie viel Uhr beginnt auf dieser Uhr die Jungsteinzeit (vor ca. 12.000 Jahren)?',
          options: [{ t: '12:00 Uhr (mittags)', ok: false }, { t: '18:00 Uhr', ok: false }, { t: '22:00 Uhr', ok: false }, { t: '23:53 Uhr', ok: true }] },
        { q: 'Was folgt daraus?',
          options: [{ t: 'Die meiste Zeit ihrer Geschichte lebten die Menschen als Jäger und Sammler.', ok: true }, { t: 'Die Menschen waren schon immer Bauern.', ok: false }] }
      ],
      hints: [
        '12.000 Jahre sind im Vergleich zu 2.500.000 Jahren sehr, sehr wenig. Die Jungsteinzeit beginnt also kurz vor Mitternacht.',
        '12.000 Jahre geteilt durch etwa 1.700 Jahre pro Minute ergibt ungefähr 7 Minuten. 7 Minuten vor Mitternacht ist es …?',
        'Lösung: 23:53 Uhr. Daraus folgt: Die meiste Zeit lebten die Menschen als Jäger und Sammler.'
      ]
    },
    experten: {
      type: 'code',
      intro: '<p>Auf dem Zeitrad steht: <i>„Stell dir vor, die ganze Geschichte der Menschen passt in <b>einen einzigen Tag</b> (24 Stunden). Um 0:00 Uhr stellen die ersten Menschen Steinwerkzeuge her – vor 2,5 Millionen Jahren. Um 24:00 Uhr ist heute.“</i></p><p><b>Stellt die Uhrzeit ein, zu der die Jungsteinzeit beginnt (vor ca. 12.000 Jahren).</b></p>',
      clock: true,
      wheels: [
        { label: 'Stunde', values: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), start: 12 },
        { label: 'Minute', values: Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), start: 0, step: 1 }
      ],
      sep: ':',
      answers: ['23:52', '23:53', '23:54'],
      hints: [
        'Ein Tag hat 24 × 60 = 1.440 Minuten. Wie viele Jahre stehen für eine Minute? Rechnet 2.500.000 : 1.440.',
        'Eine Minute steht für etwa 1.700 Jahre. 12.000 Jahre sind also etwa 12.000 : 1.700 ≈ 7 Minuten. Wie spät ist es 7 Minuten vor Mitternacht?',
        'Lösung: 23:53 Uhr. Die Jungsteinzeit beginnt erst 7 Minuten vor Mitternacht – über 99 % der Zeit lebten die Menschen als Jäger und Sammler.'
      ]
    },
    success: 'Das Zeitrad dreht sich! Auf unserer Uhr beginnt die Jungsteinzeit erst um 23:53 Uhr. Das heißt: Über 99 Prozent ihrer Geschichte lebten die Menschen als Jäger und Sammler.'
  },

  // ============================ RAUM 2 ==============================
  r2_dig: {
    room: 'r2', title: 'Die Grabung', kind: 'Untersuchung',
    type: 'scratch',
    entdecker: {
      intro: 'In der Grabungswand stecken Funde. Wischt mit dem Finger wie mit einem Pinsel über die Erde, um sie freizulegen. Findet alle <b>4 Funde</b>.',
      finds: ['faustkeil', 'nadel', 'scherbe', 'kronkorken'],
      hints: ['Wischt über die ganze Wand – von oben bis ganz nach unten.', 'Ein Fund liegt ganz unten in der tiefsten Schicht. Einer liegt fast an der Oberfläche.', 'Mit „Lösung einsetzen“ wird die ganze Wand freigelegt.']
    },
    experten: {
      intro: 'In der Grabungswand stecken Funde. Wischt mit dem Finger wie mit einem Pinsel über die Erde, um sie freizulegen. Findet alle <b>5 Funde</b>.',
      finds: ['faustkeil', 'nadel', 'scherbe', 'muenze', 'kronkorken'],
      hints: ['Wischt über die ganze Wand – von oben bis ganz nach unten.', 'In jeder der fünf Schichten steckt genau ein Fund.', 'Mit „Lösung einsetzen“ wird die ganze Wand freigelegt.']
    },
    success: 'Alle Funde sind freigelegt! Jetzt könnt ihr an der Profiltafel untersuchen, wie alt sie sind.'
  },

  r2_layers: {
    room: 'r2', title: 'Die Profiltafel', kind: 'Reihenfolge', requires: ['r2_dig'],
    type: 'place', layout: 'sequence', ends: ['am ältesten', 'am jüngsten'],
    entdecker: {
      intro: '<p>Archäologen wissen: <b>Was tiefer im Boden liegt, ist meistens älter.</b> Die unteren Schichten wurden zuerst abgelagert.</p><p>Ordnet eure Funde: <b>oben der älteste, unten der jüngste</b>.</p>',
      items: [
        { id: 'faustkeil', text: 'Faustkeil', sub: 'Schicht 4 (ganz unten)', icon: 'faustkeil' },
        { id: 'nadel', text: 'Knochennadel', sub: 'Schicht 3', icon: 'nadel' },
        { id: 'scherbe', text: 'Tonscherbe', sub: 'Schicht 2', icon: 'scherbe' },
        { id: 'kronkorken', text: 'Kronkorken', sub: 'Schicht 1 (ganz oben)', icon: 'kronkorken' }
      ],
      order: ['faustkeil', 'nadel', 'scherbe', 'kronkorken'],
      hints: ['Die tiefste Schicht ist am ältesten. Schicht 4 liegt ganz unten.', 'Der Kronkorken stammt von einer Flasche aus unserer Zeit – er ist der jüngste Fund.', 'Richtig: Faustkeil → Knochennadel → Tonscherbe → Kronkorken.']
    },
    experten: {
      intro: '<p>Archäologen wissen: <b>Was tiefer im Boden liegt, ist meistens älter.</b> Ordnet eure Funde: <b>oben der älteste, unten der jüngste</b>. Schaut euch die Grabungswand dazu noch einmal genau an.</p>',
      showProfile: true,
      items: [
        { id: 'muenze', text: 'Römische Münze', icon: 'muenze' },
        { id: 'faustkeil', text: 'Faustkeil', icon: 'faustkeil' },
        { id: 'kronkorken', text: 'Kronkorken', icon: 'kronkorken' },
        { id: 'scherbe', text: 'Tonscherbe mit Bandmuster', icon: 'scherbe' },
        { id: 'nadel', text: 'Knochennadel', icon: 'nadel' }
      ],
      order: ['faustkeil', 'nadel', 'scherbe', 'muenze', 'kronkorken'],
      hints: ['Seht euch das Bild der Grabungswand an: In welcher Schicht lag welcher Fund? Die unterste Schicht ist die älteste.', 'Die Römer lebten nach der Steinzeit (vor ca. 2.000 Jahren). Tonscherben gibt es erst seit der Jungsteinzeit.', 'Richtig: Faustkeil → Knochennadel → Tonscherbe → Römische Münze → Kronkorken.']
    },
    success: 'Genau! Je tiefer eine Schicht, desto älter ist sie meistens. So können Archäologen das Alter von Funden einschätzen, auch ohne Jahreszahl.'
  },

  r2_sources: {
    room: 'r2', title: 'Der Fundtisch', kind: 'Zuordnung',
    type: 'place', layout: 'bins',
    slots: [
      { id: 'q', label: 'Quelle', sub: 'stammt wirklich aus der Vergangenheit' },
      { id: 'r', label: 'Rekonstruktion', sub: 'heute nachgebaut oder gezeichnet' },
      { id: 'v', label: 'Vermutung', sub: 'eine Annahme, nicht bewiesen' }
    ],
    entdecker: {
      intro: 'Auf Dr. Ostermanns Tisch liegt alles durcheinander. Was ist eine echte <b>Quelle</b> aus der Vergangenheit, was eine <b>Rekonstruktion</b> und was nur eine <b>Vermutung</b>?',
      items: [
        { id: 'a', text: 'Ein Faustkeil aus Feuerstein, gefunden in einer Kiesgrube', to: 'q' },
        { id: 'b', text: 'Verkohlte Getreidekörner aus einer Ausgrabung', to: 'q' },
        { id: 'c', text: 'Ein nachgebautes Langhaus in einem Freilichtmuseum', to: 'r' },
        { id: 'd', text: 'Eine Zeichnung, wie ein Steinzeitdorf ausgesehen haben könnte', to: 'r' },
        { id: 'e', text: '„Vor der Jagd haben die Menschen getanzt.“', to: 'v' },
        { id: 'f', text: '„Der Faustkeil gehörte dem Anführer der Gruppe.“', to: 'v' }
      ],
      hints: [
        'Fragt euch: Ist das wirklich alt (Quelle)? Hat das jemand heute gebaut oder gezeichnet (Rekonstruktion)? Ist das nur eine Idee, die man nicht beweisen kann (Vermutung)?',
        'Sätze in Anführungszeichen sind hier Behauptungen. Kann man sie mit einem Fund beweisen?',
        'Quelle: Faustkeil, Getreidekörner. Rekonstruktion: Langhaus im Museum, Zeichnung. Vermutung: Tanz vor der Jagd, Faustkeil des Anführers.'
      ]
    },
    experten: {
      intro: 'Auf Dr. Ostermanns Tisch liegt alles durcheinander. Was ist eine echte <b>Quelle</b> aus der Vergangenheit, was eine <b>Rekonstruktion</b> und was nur eine <b>Vermutung</b>?',
      items: [
        { id: 'a', text: 'Ein Faustkeil aus Feuerstein, gefunden in einer Kiesgrube', to: 'q' },
        { id: 'b', text: 'Verkohlte Getreidekörner aus einer Ausgrabung', to: 'q' },
        { id: 'g', text: 'Rentierknochen mit Schnittspuren von Steinwerkzeugen', to: 'q' },
        { id: 'c', text: 'Ein nachgebautes Langhaus in einem Freilichtmuseum', to: 'r' },
        { id: 'h', text: 'Die Nachbildung der Höhle von Lascaux für Besucher', to: 'r' },
        { id: 'i', text: 'Ein lebensechtes Modell eines Neandertalers im Museum', to: 'r' },
        { id: 'e', text: '„Vor der Jagd haben die Menschen getanzt.“', to: 'v' },
        { id: 'f', text: '„Der Faustkeil gehörte dem Anführer der Gruppe.“', to: 'v' },
        { id: 'j', text: '„Die Muster auf den Töpfen waren Zeichen für Götter.“', to: 'v' }
      ],
      hints: [
        'Quelle = Überrest aus der Vergangenheit. Rekonstruktion = heute nach Funden nachgebaut. Vermutung = Annahme, die man (noch) nicht beweisen kann.',
        'Das Neandertaler-Modell und die Lascaux-Nachbildung wurden heute gemacht – auch wenn sie genau nach Funden gebaut sind. Die Knochen mit Schnittspuren sind echt alt.',
        'Quelle: Faustkeil, Getreidekörner, Rentierknochen. Rekonstruktion: Langhaus, Lascaux-Nachbildung, Neandertaler-Modell. Vermutung: Tanz, Anführer, Muster für Götter.'
      ]
    },
    success: 'Stark! Quellen sind echte Überreste aus der Vergangenheit. Rekonstruktionen machen Forscher heute nach den Funden. Und Vermutungen sind Ideen, die man (noch) nicht beweisen kann – sie sollten immer als Vermutung gekennzeichnet werden.'
  },

  r2_crate: {
    room: 'r2', title: 'Die verschlossene Forscherkiste', kind: 'Code',
    type: 'code',
    entdecker: {
      intro: '<p>Die Kiste von Dr. Ostermann hat ein Zahlenschloss. Auf dem Deckel klebt ein Zettel:</p>',
      clue: '<div class="note"><p><b>Fundplatz B – meine Funde:</b> verkohlte Getreidekörner, eine Sichel aus Feuerstein, ein Mahlstein, Knochen von Schafen und Ziegen, Pfostenlöcher eines großen Hauses.</p><p><b>Welche Aussagen kann man mit diesen Funden gut begründen?</b> Die Nummern der <u>drei</u> gut begründeten Aussagen ergeben den Code – von der kleinsten zur größten Zahl.</p><ol><li>Die Menschen bauten Getreide an.</li><li>Die Menschen ritten auf Pferden.</li><li>Die Menschen hielten Schafe und Ziegen.</li><li>Die Menschen wohnten in einem festen Haus.</li><li>Die Kinder mussten jeden Tag auf dem Feld helfen.</li></ol></div>',
      wheels: [{ values: '0123456789'.split('') }, { values: '0123456789'.split('') }, { values: '0123456789'.split('') }],
      answers: ['134'],
      hints: [
        'Prüft jede Aussage: Gibt es dazu einen passenden Fund auf der Liste?',
        'Für Pferde gibt es keinen Fund. Ob Kinder jeden Tag helfen mussten, kann man mit den Funden nicht beweisen – das ist eine Vermutung.',
        'Gut begründet sind die Aussagen 1, 3 und 4. Der Code lautet 1 – 3 – 4.'
      ]
    },
    experten: {
      intro: '<p>Die Kiste von Dr. Ostermann hat ein Zahlenschloss. Auf dem Deckel klebt ein Zettel:</p>',
      clue: '<div class="note"><p><b>Fundplatz B – meine Funde:</b> verkohlte Getreidekörner, eine Sichel aus Feuerstein, ein Mahlstein, Knochen von Schafen und Ziegen, Pfostenlöcher eines großen Hauses.</p><p><b>Welche Aussagen kann man mit diesen Funden gut begründen?</b> Die Nummern der <u>drei</u> gut begründeten Aussagen ergeben den Code – von der kleinsten zur größten Zahl.</p><ol><li>Die Menschen ritten auf Pferden.</li><li>Die Menschen bauten Getreide an und verarbeiteten es.</li><li>Im größten Haus wohnte der Anführer des Dorfes.</li><li>Die Menschen glaubten an einen Wettergott.</li><li>Die Menschen hielten Schafe und Ziegen.</li><li>Die Menschen lebten längere Zeit an einem Ort.</li><li>Die Menschen aßen jeden Tag Brot.</li></ol></div>',
      wheels: [{ values: '0123456789'.split('') }, { values: '0123456789'.split('') }, { values: '0123456789'.split('') }],
      answers: ['256'],
      hints: [
        'Eine Aussage ist gut begründet, wenn ein Fund sie belegt. Alles andere ist eine Vermutung.',
        'Getreidekörner, Sichel und Mahlstein gehören zusammen. Pfostenlöcher und Felder zeigen, dass man an einem Ort blieb. Ob jeden Tag Brot gegessen wurde, weiß man nicht.',
        'Gut begründet sind die Aussagen 2, 5 und 6. Der Code lautet 2 – 5 – 6.'
      ]
    },
    success: 'Klick – die Kiste ist offen! Forscher ziehen nur Schlussfolgerungen, die sie mit Funden begründen können. Alles andere kennzeichnen sie als Vermutung.'
  },

  // ============================ RAUM 3 ==============================
  r3_search: {
    room: 'r3', title: 'Mit der Fackel unterwegs', kind: 'Untersuchung',
    type: 'search', targets: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
    entdecker: {
      intro: 'An den Wänden und an der Decke dieser Höhle sind <b>8 Bilder</b> versteckt. Geht mit eurer Fackel nah an die Wände heran und <b>tippt auf jedes Bild</b>, das ihr entdeckt. Schaut euch genau an, was darauf zu sehen ist!',
      hints: ['Geht ganz durch die Höhle bis nach hinten. Die Fackel leuchtet nur in eurer Nähe.', 'Wischt nach unten, um nach oben zu schauen: Zwei Bilder sind an der Decke!', 'Die noch fehlenden Bilder werden jetzt mit einem goldenen Zeichen markiert.']
    },
    experten: {
      intro: 'An den Wänden und an der Decke dieser Höhle sind <b>8 Bilder</b> versteckt. Findet sie mit eurer Fackel und tippt sie an. Merkt euch genau, welche Tiere und Zeichen ihr seht – ihr braucht das gleich!',
      hints: ['Die Fackel leuchtet nur in eurer Nähe. Geht an beiden Wänden entlang bis ganz nach hinten.', 'Schaut auch nach oben: Zwei Bilder sind an der Decke.', 'Die noch fehlenden Bilder werden jetzt mit einem goldenen Zeichen markiert.']
    },
    success: 'Ihr habt alle 8 Bilder gefunden! Am Eingang der Höhle wartet die Forscherin mit ihren Fragen.'
  },

  r3_count: {
    room: 'r3', title: 'Was habt ihr gesehen?', kind: 'Beobachtung', requires: ['r3_search'],
    type: 'choice',
    entdecker: {
      intro: 'Erinnert euch an die Bilder, die ihr in der Höhle gefunden habt. Ihr könnt die Liste eurer Funde unten ansehen.',
      showFound: true,
      questions: [
        { q: 'Welches Tier war auf den Bildern am häufigsten zu sehen?', options: [{ t: 'Pferd', ok: true }, { t: 'Mammut', ok: false }, { t: 'Löwe', ok: false }, { t: 'Hirsch', ok: false }] },
        { q: 'Wie viele Menschen habt ihr auf den Bildern gesehen?', options: [{ t: 'Keine', ok: true }, { t: 'Einen', ok: false }, { t: 'Viele', ok: false }] }
      ],
      hints: ['Schaut in die Liste eurer gefundenen Bilder unten.', 'Zählt nach: 3 Pferde, 2 Auerochsen, 1 Hirsch, 1 Wisent und 1 Bild mit Zeichen.', 'Lösung: Am häufigsten war das Pferd. Menschen waren keine zu sehen. Auch in der echten Höhle von Lascaux sind Pferde die häufigsten Tiere – und es gibt nur eine einzige Menschenfigur.']
    },
    experten: {
      intro: 'Erinnert euch an die Bilder, die ihr in der Höhle gefunden habt. Ihr könnt die Liste eurer Funde unten ansehen.',
      showFound: true,
      questions: [
        { q: 'Welches Tier war auf den Bildern am häufigsten zu sehen?', options: [{ t: 'Pferd', ok: true }, { t: 'Auerochse', ok: false }, { t: 'Rentier', ok: false }, { t: 'Hirsch', ok: false }] },
        { q: 'Archäologen fanden in Lascaux in den Essensresten vor allem Knochen von Rentieren. Gemalt ist aber nur ein einziges Rentier. Welche Schlussfolgerung passt am besten?',
          options: [{ t: 'Die Menschen malten nicht einfach die Tiere, die sie am meisten aßen. Die Bilder hatten wohl eine andere Bedeutung.', ok: true }, { t: 'Die Menschen in Lascaux haben nie Rentiere gejagt.', ok: false }, { t: 'Die Rentierbilder sind alle von selbst verschwunden.', ok: false }] }
      ],
      hints: ['Schaut in die Liste eurer gefundenen Bilder. Für die zweite Frage: Was sagen die Knochen, was sagen die Bilder?', 'Die Knochen beweisen, dass Rentiere gegessen wurden. Trotzdem wurden sie kaum gemalt. Bilder zeigen also nicht einfach das „Lieblingsessen“.', 'Lösung: Pferd. Und: Die Menschen malten nicht einfach die Tiere, die sie am meisten aßen – die Bilder hatten wohl eine andere Bedeutung.']
    },
    success: 'Gut beobachtet! In Lascaux sind Pferde die häufigsten Tiere, außerdem Hirsche, Auerochsen und Wisente. Menschen sind fast nie dargestellt.'
  },

  r3_obs: {
    room: 'r3', title: 'Beobachtung oder Deutung?', kind: 'Zuordnung',
    type: 'place', layout: 'bins',
    slots: [
      { id: 'b', label: 'Beobachtung', sub: 'Das kann man sehen.' },
      { id: 'd', label: 'Deutung', sub: 'So könnte man es erklären.' }
    ],
    entdecker: {
      intro: 'Auf der Steinplatte liegen Notizen über die Höhlenbilder. Manche beschreiben, was man <b>sieht</b> (Beobachtung). Andere versuchen zu <b>erklären</b>, warum die Bilder gemalt wurden (Deutung). Sortiert sie!',
      items: [
        { id: 'a', text: 'Die Tiere sind von der Seite gemalt.', to: 'b' },
        { id: 'b2', text: 'Die Farben sind Rot, Gelb, Braun und Schwarz.', to: 'b' },
        { id: 'c', text: 'Manche Bilder sind oben an der Höhlendecke.', to: 'b' },
        { id: 'd2', text: 'Die Bilder sollten Glück bei der Jagd bringen.', to: 'd' },
        { id: 'e', text: 'Die Höhle war ein heiliger Ort.', to: 'd' },
        { id: 'f', text: 'Die Maler waren besonders wichtige Menschen.', to: 'd' }
      ],
      hints: [
        'Eine Beobachtung könnt ihr mit den Augen überprüfen. Eine Deutung ist eine Erklärung, die man nicht sehen kann.',
        'Fragt euch: Kann ich das an der Höhlenwand sehen? Ob die Bilder Glück bringen sollten, kann man nicht sehen.',
        'Beobachtung: von der Seite gemalt, Farben, Bilder an der Decke. Deutung: Jagdglück, heiliger Ort, wichtige Maler.'
      ]
    },
    experten: {
      intro: 'Auf der Steinplatte liegen Notizen über die Höhlenbilder. Manche beschreiben, was man <b>sieht</b> (Beobachtung). Andere versuchen zu <b>erklären</b>, warum die Bilder gemalt wurden (Deutung). Sortiert sie!',
      items: [
        { id: 'a', text: 'Die Tiere sind von der Seite gemalt.', to: 'b' },
        { id: 'b2', text: 'Die Farben sind Rot, Gelb, Braun und Schwarz.', to: 'b' },
        { id: 'c', text: 'Manche Bilder sind oben an der Höhlendecke.', to: 'b' },
        { id: 'g', text: 'Neben den Tieren gibt es Punkte und Striche.', to: 'b' },
        { id: 'h', text: 'Auf den Bildern sind keine Menschen zu sehen.', to: 'b' },
        { id: 'd2', text: 'Die Bilder sollten Glück bei der Jagd bringen.', to: 'd' },
        { id: 'e', text: 'Die Höhle war ein heiliger Ort.', to: 'd' },
        { id: 'f', text: 'Die Maler waren besonders wichtige Menschen.', to: 'd' },
        { id: 'i', text: 'Die Punkte sind ein Kalender für die Jagdzeiten.', to: 'd' }
      ],
      hints: [
        'Eine Beobachtung könnt ihr mit den Augen überprüfen. Eine Deutung ist eine mögliche Erklärung – Forscher sind sich dabei oft nicht einig.',
        'Vorsicht bei den Punkten: Dass es Punkte gibt, sieht man. Was sie bedeuten, ist eine Deutung.',
        'Beobachtung: von der Seite, Farben, Decke, Punkte und Striche, keine Menschen. Deutung: Jagdglück, heiliger Ort, wichtige Maler, Kalender.'
      ]
    },
    success: 'Genau unterschieden! Eine Beobachtung kann jeder überprüfen. Eine Deutung ist eine mögliche Erklärung. Warum die Menschen in Lascaux gemalt haben, wissen wir bis heute nicht sicher.'
  },

  r3_paint: {
    room: 'r3', title: 'Die Farbwerkstatt', kind: 'Zuordnung',
    type: 'place', layout: 'pairs',
    entdecker: {
      intro: 'Hier liegen Dinge, die die Höhlenmaler benutzt haben. Wofür brauchten sie diese Dinge? Ordnet jedem Gegenstand den richtigen Zweck zu.',
      slots: [
        { id: 's1', label: 'Holzkohle', icon: 'kohle' },
        { id: 's2', label: 'Ocker (farbige Erde)', icon: 'ocker' },
        { id: 's3', label: 'Steinlampe mit Tierfett', icon: 'lampe' },
        { id: 's4', label: 'Hohler Vogelknochen', icon: 'knochen' }
      ],
      items: [
        { id: 'a', text: 'schwarze Farbe', to: 's1' },
        { id: 'b', text: 'rote und gelbe Farbe', to: 's2' },
        { id: 'c', text: 'Licht in der dunklen Höhle', to: 's3' },
        { id: 'd', text: 'Farbe auf die Wand pusten', to: 's4' }
      ],
      hints: ['Denkt an ein Lagerfeuer: Was bleibt übrig, wenn Holz verbrennt – und welche Farbe hat es?', 'Durch einen hohlen Knochen kann man pusten wie durch einen Strohhalm.', 'Holzkohle → schwarz, Ocker → rot und gelb, Steinlampe → Licht, hohler Knochen → Farbe pusten.']
    },
    experten: {
      intro: 'Hier liegen Dinge, die die Höhlenmaler benutzt haben. Wofür brauchten sie diese Dinge? Ordnet jedem Gegenstand den richtigen Zweck zu.',
      slots: [
        { id: 's1', label: 'Holzkohle', icon: 'kohle' },
        { id: 's2', label: 'Ocker (farbige Erde)', icon: 'ocker' },
        { id: 's3', label: 'Steinlampe mit Tierfett', icon: 'lampe' },
        { id: 's4', label: 'Hohler Vogelknochen', icon: 'knochen' },
        { id: 's5', label: 'Gerüst aus Holzstämmen', icon: 'geruest' },
        { id: 's6', label: 'Spitzer Feuerstein', icon: 'feuerstein' }
      ],
      items: [
        { id: 'a', text: 'schwarze Farbe', to: 's1' },
        { id: 'b', text: 'rote und gelbe Farbe', to: 's2' },
        { id: 'c', text: 'Licht in der dunklen Höhle', to: 's3' },
        { id: 'd', text: 'Farbe auf die Wand pusten', to: 's4' },
        { id: 'e', text: 'hoch oben an der Decke malen', to: 's5' },
        { id: 'f', text: 'Linien in den Fels ritzen', to: 's6' }
      ],
      hints: ['Denkt an ein Lagerfeuer: Was bleibt übrig, wenn Holz verbrennt? Und wie kommt man an eine hohe Decke?', 'In Lascaux fand man Löcher in der Wand, in denen wohl Balken steckten. Mit einer scharfen Steinspitze kann man in weichen Fels kratzen.', 'Holzkohle → schwarz, Ocker → rot/gelb, Steinlampe → Licht, Knochen → pusten, Gerüst → Decke bemalen, Feuerstein → ritzen.']
    },
    success: 'Richtig! Die Maler stellten ihre Farben aus Erde (Ocker), Holzkohle und Mineralien her. Licht gaben Steinlampen mit Tierfett. Für hohe Stellen bauten sie wohl Gerüste.'
  },

  // ============================ RAUM 4 ==============================
  r4_explore: {
    room: 'r4', title: 'Rundgang durch das Dorf', kind: 'Erkundung',
    type: 'search', targets: ['x_haus', 'x_feld', 'x_tiere', 'x_speicher', 'x_brunnen', 'x_werkstatt'], infoTargets: true,
    entdecker: {
      intro: 'Erkundet das Dorf! Geht zu den <b>6 blauen Info-Zeichen</b> <span class="mk mk-info">i</span>, lest die Texte und beantwortet jeweils die kleine Frage.',
      hints: ['Die blauen Zeichen schweben über dem Langhaus, dem Feld, dem Tierpferch, den Vorratstöpfen, dem Brunnen und dem Webstuhl.', 'Im Forscherbuch seht ihr, welche Stationen noch fehlen. Mit „Hingehen“ lauft ihr direkt hin.', 'Öffnet das Forscherbuch und tippt bei den fehlenden Stationen auf „Hingehen“.']
    },
    experten: {
      intro: 'Erkundet das Dorf! Geht zu den <b>6 blauen Info-Zeichen</b> <span class="mk mk-info">i</span>, lest die Texte genau und beantwortet jeweils die kleine Frage. Die Infos helfen euch bei den anderen Rätseln im Dorf.',
      hints: ['Die blauen Zeichen schweben über dem Langhaus, dem Feld, dem Tierpferch, den Vorratstöpfen, dem Brunnen und dem Webstuhl.', 'Im Forscherbuch seht ihr, welche Stationen noch fehlen. Mit „Hingehen“ lauft ihr direkt hin.', 'Öffnet das Forscherbuch und tippt bei den fehlenden Stationen auf „Hingehen“.']
    },
    success: 'Rundgang geschafft! Ihr habt gesehen: Die Bauern lebten sesshaft, bauten Getreide an, hielten Tiere, legten Vorräte an und stellten viele Dinge selbst her.'
  },

  r4_compare: {
    room: 'r4', title: 'Jäger trifft Bäuerin', kind: 'Vergleich',
    type: 'place', layout: 'grid',
    cols: [{ id: 'j', label: 'Jäger und Sammler' }, { id: 'b', label: 'Bauern' }],
    entdecker: {
      intro: 'Am Dorfrand treffen sich ein Jäger und eine Bäuerin. Vergleicht ihr Leben: Legt jede Karte in das richtige Feld der Tabelle.',
      rows: [{ id: 'w', label: 'Wohnen' }, { id: 'n', label: 'Nahrung' }, { id: 'l', label: 'Lebensweise' }],
      items: [
        { id: 'a', text: 'Zelte aus Fellen und Stangen', to: 'w_j' },
        { id: 'b2', text: 'Langhäuser aus Holz und Lehm', to: 'w_b' },
        { id: 'c', text: 'jagen, fischen und sammeln', to: 'n_j' },
        { id: 'd', text: 'Getreide anbauen und Tiere halten', to: 'n_b' },
        { id: 'e', text: 'ziehen umher (nicht sesshaft)', to: 'l_j' },
        { id: 'f', text: 'bleiben an einem Ort (sesshaft)', to: 'l_b' }
      ],
      hints: ['Geht Zeile für Zeile vor: Wie wohnt, isst und lebt ein Jäger? Wie eine Bäuerin?', 'Wer umherzieht, braucht eine Wohnung, die man schnell abbauen und tragen kann.', 'Jäger: Zelte – jagen und sammeln – ziehen umher. Bauern: Langhäuser – Getreide und Tiere – sesshaft.']
    },
    experten: {
      intro: 'Am Dorfrand treffen sich ein Jäger und eine Bäuerin. Vergleicht ihr Leben: Legt jede Karte in das richtige Feld der Tabelle.',
      rows: [{ id: 'w', label: 'Wohnen' }, { id: 'n', label: 'Nahrung' }, { id: 'l', label: 'Lebensweise' }, { id: 't', label: 'Werkzeuge' }, { id: 'v', label: 'Vorräte' }],
      items: [
        { id: 'a', text: 'Zelte aus Fellen und Stangen', to: 'w_j' },
        { id: 'b2', text: 'Langhäuser aus Holz und Lehm', to: 'w_b' },
        { id: 'c', text: 'jagen, fischen und sammeln', to: 'n_j' },
        { id: 'd', text: 'Getreide anbauen und Tiere halten', to: 'n_b' },
        { id: 'e', text: 'ziehen umher (nicht sesshaft)', to: 'l_j' },
        { id: 'f', text: 'bleiben an einem Ort (sesshaft)', to: 'l_b' },
        { id: 'g', text: 'Speer, Speerschleuder, Faustkeil', to: 't_j' },
        { id: 'h', text: 'Steinbeil, Sichel, Mahlstein', to: 't_b' },
        { id: 'i', text: 'kaum Vorräte – alles muss getragen werden', to: 'v_j' },
        { id: 'k', text: 'Vorräte in Tongefäßen und Gruben', to: 'v_b' }
      ],
      hints: ['Geht Zeile für Zeile vor. Denkt daran, was ihr im Dorf gesehen habt.', 'Mit einer Sichel erntet man Getreide, auf einem Mahlstein mahlt man Körner. Schwere Tontöpfe nimmt man nicht auf Wanderungen mit.', 'Jäger: Zelte – jagen/sammeln – umherziehen – Speer/Faustkeil – kaum Vorräte. Bauern: Langhäuser – Getreide/Tiere – sesshaft – Steinbeil/Sichel/Mahlstein – Vorräte in Tongefäßen.']
    },
    success: 'Super verglichen! Mit Ackerbau und Viehhaltung änderte sich fast alles: Wohnen, Essen, Werkzeuge und Besitz.'
  },

  r4_bread: {
    room: 'r4', title: 'Vom Korn zum Brot', kind: 'Reihenfolge',
    type: 'place', layout: 'sequence', ends: ['zuerst', 'zuletzt'],
    entdecker: {
      intro: 'Am Mahlstein liegen Bildkarten. Bringt die Arbeiten der Bauern in die richtige Reihenfolge – vom Feld bis zum Brot.',
      items: [
        { id: 'a', text: 'Den Boden mit einer Hacke lockern' },
        { id: 'b', text: 'Die Getreidekörner aussäen' },
        { id: 'c', text: 'Das reife Getreide mit der Sichel ernten' },
        { id: 'd', text: 'Die Körner auf dem Mahlstein zu Mehl mahlen' },
        { id: 'e', text: 'Fladenbrot backen' }
      ],
      order: ['a', 'b', 'c', 'd', 'e'],
      hints: ['Bevor man etwas säen kann, muss der Boden vorbereitet werden.', 'Erst muss das Getreide wachsen und geerntet werden, dann kann man Mehl machen.', 'Richtig: Boden lockern → säen → ernten → mahlen → backen.']
    },
    experten: {
      intro: 'Am Mahlstein liegen Bildkarten. Bringt die Arbeiten der Bauern in die richtige Reihenfolge – vom Wald bis zum Brot.',
      items: [
        { id: 'f', text: 'Bäume mit dem Steinbeil fällen (Wald roden)' },
        { id: 'a', text: 'Den Boden mit einer Hacke lockern' },
        { id: 'b', text: 'Die Getreidekörner aussäen' },
        { id: 'g', text: 'Das wachsende Getreide vor Wildtieren schützen' },
        { id: 'c', text: 'Das reife Getreide mit der Sichel ernten' },
        { id: 'h', text: 'Die Körner aus den Ähren lösen (dreschen)' },
        { id: 'd', text: 'Die Körner auf dem Mahlstein zu Mehl mahlen' },
        { id: 'e', text: 'Fladenbrot backen' }
      ],
      order: ['f', 'a', 'b', 'g', 'c', 'h', 'd', 'e'],
      hints: ['Wo ein Feld entstehen soll, stand vorher oft Wald.', 'Nach der Ernte stecken die Körner noch in den Ähren. Erst muss man sie herauslösen, bevor man sie mahlen kann.', 'Richtig: roden → Boden lockern → säen → schützen → ernten → dreschen → mahlen → backen.']
    },
    success: 'Lecker! Ackerbau war harte Arbeit – und sie dauerte das ganze Jahr. Deshalb mussten die Bauern bei ihren Feldern bleiben.'
  },

  r4_cloze: {
    room: 'r4', title: 'Die Steintafel am Dorfplatz', kind: 'Lückentext',
    type: 'place', layout: 'cloze',
    entdecker: {
      intro: 'Auf der Steintafel fehlen Wörter. Setzt die richtigen Wörter in die Lücken. Nicht alle Wörter werden gebraucht!',
      text: 'In der Jungsteinzeit begannen die Menschen, Getreide [[g1]] und Tiere zu [[g2]]. Weil sie bei ihren Feldern bleiben mussten, wurden sie [[g3]]. Diese große Veränderung nennt man die [[g4]].',
      items: [
        { id: 'w1', text: 'anzubauen', to: 'g1' },
        { id: 'w2', text: 'halten', to: 'g2' },
        { id: 'w3', text: 'sesshaft', to: 'g3' },
        { id: 'w4', text: 'neolithische Revolution', to: 'g4' },
        { id: 'w5', text: 'Nomaden' },
        { id: 'w6', text: 'Höhlenmalerei' }
      ],
      hints: ['„Neolithisch“ bedeutet „jungsteinzeitlich“ (griechisch: neos = neu, lithos = Stein).', 'Wer an einem Ort bleibt, ist sesshaft. Nomaden ziehen umher.', 'Lösung: anzubauen – halten – sesshaft – neolithische Revolution.']
    },
    experten: {
      intro: 'Auf der Steintafel fehlen Wörter. Setzt die richtigen Wörter in die Lücken. Nicht alle Wörter werden gebraucht!',
      text: 'Vor etwa 11.500 Jahren begannen Menschen im [[g1]], Getreide anzubauen und Tiere zu halten. Sie wurden [[g2]] und legten [[g3]] an. Nach und nach breitete sich diese Lebensweise bis nach Mitteleuropa aus – im Rheinland lebten die ersten Bauern um [[g4]]. Diesen Wandel nennt man [[g5]]. Er dauerte aber viele [[g6]] – es war also keine schnelle Revolution.',
      items: [
        { id: 'w1', text: 'Fruchtbaren Halbmond', to: 'g1' },
        { id: 'w2', text: 'sesshaft', to: 'g2' },
        { id: 'w3', text: 'Vorräte', to: 'g3' },
        { id: 'w4', text: '5.300 v. Chr.', to: 'g4' },
        { id: 'w5', text: 'neolithische Revolution', to: 'g5' },
        { id: 'w6', text: 'Jahrtausende', to: 'g6' },
        { id: 'w7', text: 'Nomaden' },
        { id: 'w8', text: '1.500 n. Chr.' },
        { id: 'w9', text: 'Wochen' }
      ],
      hints: ['Der Fruchtbare Halbmond liegt im heutigen Vorderasien (z. B. Irak, Syrien, Türkei). Dort begann der Ackerbau.', 'Die ersten Bauern im Rheinland findet ihr auch auf dem Zeitstrahl der Zeitkammer. Der Wandel geschah nicht in Wochen, sondern sehr langsam.', 'Lösung: Fruchtbaren Halbmond – sesshaft – Vorräte – 5.300 v. Chr. – neolithische Revolution – Jahrtausende.']
    },
    success: 'Die Steintafel leuchtet! Den Übergang vom Jäger und Sammler zum sesshaften Bauern nennt man neolithische Revolution. „Revolution“ heißt hier: Das Leben veränderte sich völlig – auch wenn es sehr lange dauerte.'
  },

  // ============================ TOR ================================
  gate: {
    room: 'hub', title: 'Das Tor der Zeit', kind: 'Code',
    type: 'code', gate: true,
    entdecker: {
      intro: '<p>Ihr habt alle vier Steintäfelchen! Unter den Mulden steht eine Inschrift:</p><p class="note big">„Was zuerst geschah, steht vorn.<br>Was heute geschieht, steht hinten.“</p><p>Ordnet die Täfelchen in Gedanken <b>von alt nach jung</b> und stellt den Code ein.</p>',
      gateLabels: true,
      wheels: [{ values: '0123456789'.split('') }, { values: '0123456789'.split('') }, { values: '0123456789'.split('') }, { values: '0123456789'.split('') }],
      answers: [GATE_CODE],
      hints: ['Welches Symbol steht für die ältesten Werkzeuge der Menschen? Welches steht für die Forscher von heute?', 'Reihenfolge: Faustkeil (Altsteinzeit) → Höhlenpferd (Lascaux, vor 17.000 Jahren) → Getreideähre (erste Bauern) → Forscherpinsel (heute).', 'Der Code lautet 3 – 1 – 6 – 8.']
    },
    experten: {
      intro: '<p>Ihr habt alle vier Steintäfelchen! Unter den Mulden steht eine Inschrift:</p><p class="note big">„Was zuerst geschah, steht vorn.<br>Was heute geschieht, steht hinten.“</p><p>Stellt den Code ein.</p>',
      wheels: [{ values: '0123456789'.split('') }, { values: '0123456789'.split('') }, { values: '0123456789'.split('') }, { values: '0123456789'.split('') }],
      answers: [GATE_CODE],
      hints: ['Jedes Symbol steht für eine Zeit. Ordnet die Zeiten von alt nach jung.', 'Der Pinsel gehört zu den Archäologen – also zu heute. Er steht hinten.', 'Faustkeil (3) → Höhlenpferd (1) → Getreideähre (6) → Forscherpinsel (8). Der Code lautet 3 – 1 – 6 – 8.']
    },
    success: 'Ein tiefes Grollen geht durch die Höhle … Das Tor öffnet sich!'
  },

  // ============================ FINALE ==============================
  u_explore: {
    room: 'uruk', title: 'Die Merkmale der Stadt', kind: 'Erkundung',
    type: 'search', infoTargets: true,
    targets: ['u_landwirtschaft', 'u_bewaesserung', 'u_arbeitsteilung', 'u_handel', 'u_verwaltung', 'u_schrift', 'u_bauwerke'],
    entdecker: {
      intro: 'Erkundet Uruk! Findet die <b>7 blauen Info-Zeichen</b> <span class="mk mk-info">i</span>. Sie zeigen euch die Merkmale der ersten Stadt.',
      hints: ['Schaut zu den Feldern und Kanälen am Fluss, zu den Werkstätten, zum Markt, zum Speicher, zum Schreiber und zum großen Tempel.', 'Im Forscherbuch seht ihr, welche Merkmale noch fehlen. Mit „Hingehen“ lauft ihr direkt hin.', 'Öffnet das Forscherbuch und tippt bei den fehlenden Merkmalen auf „Hingehen“.']
    },
    experten: {
      intro: 'Erkundet Uruk! Findet die <b>7 blauen Info-Zeichen</b> <span class="mk mk-info">i</span> und lest genau: Ihr braucht das Wissen für die große Frage am Ende.',
      hints: ['Schaut zu den Feldern und Kanälen am Fluss, zu den Werkstätten, zum Markt, zum Speicher, zum Schreiber und zum großen Tempel.', 'Im Forscherbuch seht ihr, welche Merkmale noch fehlen. Mit „Hingehen“ lauft ihr direkt hin.', 'Öffnet das Forscherbuch und tippt bei den fehlenden Merkmalen auf „Hingehen“.']
    },
    success: 'Ihr habt alle sieben Merkmale entdeckt! Auf dem Stadtplatz wartet jetzt die große Frage.'
  },

  u_final: {
    room: 'uruk', title: 'Die große Frage', kind: 'Schlussfolgerung', requires: ['u_explore'],
    type: 'place', layout: 'sequence', ends: ['Anfang', 'Ende'],
    entdecker: {
      intro: '<p class="note big">Wie wurden aus kleinen Dörfern die ersten Hochkulturen?</p><p>Bringt die Sätze in die richtige Reihenfolge. So entsteht eine Erklärung, bei der ein Schritt zum nächsten führt.</p>',
      items: [
        { id: 'a', text: 'Die Bauern legen Kanäle an und bewässern ihre Felder.' },
        { id: 'b', text: 'Sie ernten mehr, als sie selbst brauchen. Es gibt einen Überschuss.' },
        { id: 'c', text: 'Weil es genug Nahrung gibt, wachsen Dörfer zu großen Städten mit vielen Tausend Menschen.' },
        { id: 'd', text: 'In der Stadt müssen nicht mehr alle Bauern sein: Es gibt Handwerker, Händler und Priester (Arbeitsteilung).' },
        { id: 'e', text: 'Vorräte, Abgaben und Waren müssen verwaltet werden. Dafür entsteht die Schrift.' }
      ],
      order: ['a', 'b', 'c', 'd', 'e'],
      hints: ['Am Anfang steht das Wasser: Ohne Bewässerung wächst im trockenen Mesopotamien kaum etwas.', 'Achtet auf Wörter, die auf den Satz davor verweisen: „Weil es genug Nahrung gibt …“, „In der Stadt …“.', 'Richtig: Bewässerung → Überschuss → Städte → Arbeitsteilung → Verwaltung und Schrift.']
    },
    experten: {
      intro: '<p class="note big">Wie wurden aus kleinen Dörfern die ersten Hochkulturen?</p><p>Bringt die Sätze in die richtige Reihenfolge. So entsteht eine Erklärung, bei der ein Schritt zum nächsten führt.</p>',
      items: [
        { id: 'z', text: 'In der Jungsteinzeit werden die Menschen sesshaft und leben als Bauern in Dörfern.' },
        { id: 'a', text: 'Im trockenen Mesopotamien legen die Bauern Kanäle an und bewässern ihre Felder.' },
        { id: 'b', text: 'Sie ernten mehr, als sie selbst brauchen. Es gibt einen Überschuss.' },
        { id: 'c', text: 'Weil es genug Nahrung gibt, wachsen Dörfer zu großen Städten mit vielen Tausend Menschen.' },
        { id: 'd', text: 'In der Stadt müssen nicht mehr alle Bauern sein: Es gibt Handwerker, Händler und Priester (Arbeitsteilung).' },
        { id: 'e', text: 'Vorräte, Abgaben und Waren müssen verwaltet werden. Dafür entsteht die Schrift.' },
        { id: 'y', text: 'Mit Städten, Arbeitsteilung, Verwaltung, Schrift und großen Tempeln ist eine Hochkultur entstanden.' }
      ],
      order: ['z', 'a', 'b', 'c', 'd', 'e', 'y'],
      hints: ['Beginnt mit dem, was ihr aus dem Dorf schon kennt. Am Ende steht das Ergebnis.', 'Achtet auf Wörter, die auf den Satz davor verweisen: „Sie ernten …“, „Weil es genug Nahrung gibt …“, „In der Stadt …“.', 'Richtig: sesshafte Bauern → Bewässerung → Überschuss → Städte → Arbeitsteilung → Verwaltung und Schrift → Hochkultur.']
    },
    success: 'Das ist die Antwort auf die große Frage!'
  }
};

// Funde der Grabung (r2_dig) – Schicht 1 = oben
const FINDS = {
  kronkorken: { name: 'Kronkorken', layer: 1, desc: 'Verschluss einer Glasflasche – aus unserer Zeit.' },
  muenze: { name: 'Römische Münze', layer: 2, desc: 'Eine Münze aus der Römerzeit (vor ca. 2.000 Jahren).' },
  scherbe: { name: 'Tonscherbe mit Bandmuster', layer: 3, desc: 'Stück eines Tontopfes der ersten Bauern (Jungsteinzeit).' },
  nadel: { name: 'Knochennadel', layer: 4, desc: 'Nähnadel aus Knochen – damit nähte man Kleidung aus Fellen (Altsteinzeit).' },
  faustkeil: { name: 'Faustkeil', layer: 5, desc: 'Ein Allzweckwerkzeug aus Feuerstein – eines der ältesten Werkzeuge der Menschen.' }
};

// Höhlenbilder (r3_search)
const PAINTINGS = {
  p1: { name: 'Pferd', kind: 'horse' },
  p2: { name: 'Auerochse (Wildrind)', kind: 'aurochs' },
  p3: { name: 'Pferd', kind: 'horse2' },
  p4: { name: 'Hirsch', kind: 'deer' },
  p5: { name: 'Zeichen: Punkte und Gitter', kind: 'signs' },
  p6: { name: 'Wisent', kind: 'bison' },
  p7: { name: 'Pferd', kind: 'horse' },
  p8: { name: 'Auerochse (Wildrind)', kind: 'aurochs' }
};

const FINAL_TEXT = {
  merksatz: 'In Mesopotamien bewässerten die Bauern ihre Felder mit Kanälen. So ernteten sie mehr, als sie brauchten. Dieser Überschuss ernährte viele Menschen – aus Dörfern wurden Städte wie Uruk. Dort mussten nicht mehr alle Bauern sein: Es entstand Arbeitsteilung. Um Vorräte, Abgaben und Handel zu verwalten, erfanden die Menschen die Schrift. Städte mit Verwaltung, Schrift, Arbeitsteilung und großen Bauwerken nennt man Hochkulturen.',
  ausblick: 'Uruk war eine der ersten Städte der Welt. In der nächsten Unterrichtsreihe „Die ersten Hochkulturen“ lernt ihr mehr über Mesopotamien und Ägypten.'
};
