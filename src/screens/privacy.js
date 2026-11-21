import { html } from "../lib/dom.js";
import { icon } from "../components/icons.js";

export default {
  title: "Privacy",
  render(app) {
    const { site } = app.data;
    return html`
      <a class="link back" href="#/account">${icon("back")} Account</a>
      <h1>Privacy</h1>
      <p class="demo-banner"><span><strong>Concept</strong>Deze tekst is een voorlopige samenvatting van wat de demo doet. De eigenaar of een jurist moet hem nog controleren voordat de app echt wordt gebruikt.</span></p>
      <section class="stack prose"><h2>Wat staat er op je toestel?</h2>
        <p>Alles wat je invult blijft in de opslag van je eigen browser (localStorage): naam, telefoonnummer, e-mailadres, je mandje, je demo-bestellingen, je demo-punten en je favorieten.</p></section>
      <section class="stack prose"><h2>Wat verlaat je toestel niet?</h2>
        <p>Niets. De app stuurt geen gegevens naar De Zon of naar een ander bedrijf. Er zijn geen cookies, geen statistiek, geen advertenties en geen externe lettertypes. Een demo-bestelling bereikt De Zon dus niet.</p></section>
      <section class="stack prose"><h2>Links naar buiten</h2>
        <p>Route, bellen en mailen openen Google Maps, je belapp of je mailapp. Daar gelden de regels van die diensten.</p></section>
      <section class="stack prose"><h2>Wissen</h2>
        <p>Onder Account kies je "Wis mijn gegevens op dit toestel". Dan verdwijnt alles. Je kunt ook de websitegegevens van deze app in je browser verwijderen.</p></section>
      <section class="stack prose"><h2>Straks, met een echte koppeling</h2>
        <p>Zodra bestellen, sparen of accounts via een server lopen, verandert dit. Dan zijn onder meer nodig: een duidelijke verantwoordelijke, een bewaartermijn, een verwerkersovereenkomst met de leverancier, uitleg over inzage en verwijdering (AVG), en toestemming voor alles wat niet strikt nodig is. Zie docs/PUBLICEREN.md.</p></section>
      <p class="small muted">Vragen: ${site.email} of ${site.phoneDisplay}.</p>`;
  },
};
