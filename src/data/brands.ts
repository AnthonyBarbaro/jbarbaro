import type { Brand } from "@/types/site";

const placeholderImage = "/images/brands/brand-placeholder.svg";
const placeholderLogo = "/images/brands/logo-placeholder.svg";
const mediaBase = "/images/remote/www.jasonbarbaro.com/assets/media";

const brandMedia: Record<string, { image: string; logo: string }> = {
  "7-downie-st": {
    image: `${mediaBase}/2020/02/7downiest-012120-008-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_7_downie-200x200.png`,
  },
  "7-for-all-mankind": {
    image: `${mediaBase}/2020/02/7forallmankind-012120-023-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_7_for_all_mankind-200x200.png`,
  },
  "ag-jeans": {
    image: `${mediaBase}/2020/02/ag-012120-038-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_ag_jeans-200x200.png`,
  },
  alberto: {
    image: `${mediaBase}/2020/02/alberto-012120-049-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_alberto-200x200.png`,
  },
  brax: {
    image: `${mediaBase}/2020/04/brax-012220-070-2-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_brax-200x200.png`,
  },
  canali: {
    image: `${mediaBase}/2020/02/canali-072319-080-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_canali-200x200.png`,
  },
  "ermenegildo-zegna": {
    image: `${mediaBase}/2020/02/zenga-012220-324-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_zenga-200x200.png`,
  },
  eton: {
    image: `${mediaBase}/2020/02/eton-012220-114-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_eton-200x200.png`,
  },
  fradi: {
    image: `${mediaBase}/2022/01/fradi-131031-003-500x500.jpg`,
    logo: `${mediaBase}/2022/01/fradi.png`,
  },
  gimos: {
    image: `${mediaBase}/2020/02/gimos-050819-138-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_gimos-200x200.png`,
  },
  "giorgio-armani": {
    image: `${mediaBase}/2020/02/armani-041319-057-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_armani-200x200.png`,
  },
  hagen: {
    image: `${mediaBase}/2020/02/hagen-012420-150-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_hagen-200x200.png`,
  },
  "holebrook-usa": {
    image: `${mediaBase}/2022/01/holebrook_usa-131026-021-500x500.jpg`,
    logo: `${mediaBase}/2022/01/holebrook.png`,
  },
  "jack-victor": {
    image: `${mediaBase}/2020/02/jackvictor-052819-161-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_jack_victor-200x200.png`,
  },
  "joes-jean": {
    image: `${mediaBase}/2020/02/joesjeans-012420-175-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_joes_jeans-200x200.png`,
  },
  "l-b-m": {
    image: `${mediaBase}/2020/02/lbm-012420-190-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_lbm-200x200.png`,
  },
  "luigi-bianchi": {
    image: `${mediaBase}/2020/02/luigi_bianchi-012420-221-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_luigi-bianchi-200x200.png`,
  },
  "michael-kors": {
    image: `${mediaBase}/2020/02/michael_kors-012420-227-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_michael_kores-200x200.png`,
  },
  monfrere: {
    image: `${mediaBase}/2022/01/monfrere-131041-005-500x500.jpg`,
    logo: `${mediaBase}/2022/01/monfrere.png`,
  },
  paige: {
    image: `${mediaBase}/2022/01/paige-131049-005-500x500.jpg`,
    logo: `${mediaBase}/2022/01/paige.png`,
  },
  "pal-zileri": {
    image: `${mediaBase}/2020/02/pal_zileri-012420-236-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_pal_zileri-200x200.png`,
  },
  ravazzolo: {
    image: `${mediaBase}/2022/01/ravazzolo-131004-003-500x500.jpg`,
    logo: `${mediaBase}/2022/01/ravazzolo.png`,
  },
  "robert-graham": {
    image: `${mediaBase}/2020/02/robert_graham-062619-252-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_robert_graham-200x200.png`,
  },
  stenstroms: {
    image: `${mediaBase}/2020/04/stenstroms-012420-2645555-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_stenstroms-200x200.png`,
  },
  swims: {
    image: `${mediaBase}/2022/01/swims-131051-024-500x500.jpg`,
    logo: `${mediaBase}/2022/01/swims.png`,
  },
  tateossian: {
    image: `${mediaBase}/2020/02/tateossian-111716-278-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_tateossian-200x200.png`,
  },
  "ted-baker": {
    image: `${mediaBase}/2020/02/tedbaker-012320-304-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_ted_baker-200x200.png`,
  },
  zanella: {
    image: `${mediaBase}/2020/02/zanella-012220-099-500x500.jpg`,
    logo: `${mediaBase}/2020/01/logo_zanella-200x200.png`,
  },
};

function mediaFor(slug: string) {
  return brandMedia[slug] || { image: placeholderImage, logo: placeholderLogo };
}

export const brands: Brand[] = [
  { slug: "7-downie-st", name: "7 Downie St.", ...mediaFor("7-downie-st"), featured: true, description: "Contemporary tailoring and statement sportswear from Canada." },
  { slug: "7-for-all-mankind", name: "7 For All Mankind", ...mediaFor("7-for-all-mankind"), featured: true, description: "Premium denim with modern fits and sophisticated washes." },
  { slug: "ag-jeans", name: "AG Jeans", ...mediaFor("ag-jeans"), featured: true, description: "Luxury denim brand known for clean styling and comfort." },
  { slug: "alberto", name: "Alberto", ...mediaFor("alberto"), featured: true, description: "Performance trousers engineered for movement and polish." },
  { slug: "brax", name: "Brax", ...mediaFor("brax"), featured: true, description: "German quality casualwear with premium everyday fabrics." },
  { slug: "canali", name: "Canali", ...mediaFor("canali"), featured: true, description: "Italian luxury tailoring with timeless elegance and craftsmanship." },
  { slug: "ermenegildo-zegna", name: "Ermenegildo Zegna", ...mediaFor("ermenegildo-zegna"), featured: true, description: "Heritage menswear brand delivering refined fabrics and suiting." },
  { slug: "eton", name: "Eton", ...mediaFor("eton"), featured: true, description: "Luxury shirts crafted in Sweden for a precise fit." },
  { slug: "fradi", name: "Fradi", ...mediaFor("fradi"), featured: false, description: "Italian outerwear and jackets with modern tailoring cues." },
  { slug: "gimos", name: "Gimos", ...mediaFor("gimos"), featured: false, description: "Made-in-Italy leatherwear and seasonal luxury layers." },
  { slug: "giorgio-armani", name: "Giorgio Armani", ...mediaFor("giorgio-armani"), featured: true, description: "Iconic Italian fashion house known for modern elegance." },
  { slug: "hagen", name: "Hagen", ...mediaFor("hagen"), featured: false, description: "Modern essentials designed with understated confidence." },
  { slug: "holebrook-usa", name: "Holebrook USA", ...mediaFor("holebrook-usa"), featured: false, description: "Scandinavian-inspired knitwear and premium layering pieces." },
  { slug: "jack-victor", name: "Jack Victor", ...mediaFor("jack-victor"), featured: true, description: "North American tailoring rooted in fine construction." },
  { slug: "joes-jean", name: "Joe's Jeans", ...mediaFor("joes-jean"), featured: false, description: "Premium denim and lifestyle staples with modern cuts." },
  { slug: "l-b-m", name: "L.B.M.", ...mediaFor("l-b-m"), featured: true, description: "Italian soft tailoring balancing tradition and innovation." },
  { slug: "luigi-bianchi", name: "Luigi Bianchi", ...mediaFor("luigi-bianchi"), featured: true, description: "Expertly crafted suiting from an Italian tailoring lineage." },
  { slug: "michael-kors", name: "Michael Kors", ...mediaFor("michael-kors"), featured: false, description: "Contemporary designer menswear with polished versatility." },
  { slug: "monfrere", name: "Monfrere", ...mediaFor("monfrere"), featured: false, description: "Luxury street-inflected denim and modern essentials." },
  { slug: "paige", name: "Paige", ...mediaFor("paige"), featured: false, description: "California-crafted denim and refined casual staples." },
  { slug: "pal-zileri", name: "Pal Zileri", ...mediaFor("pal-zileri"), featured: true, description: "Italian sartorial style built for contemporary wardrobes." },
  { slug: "ravazzolo", name: "Ravazzolo", ...mediaFor("ravazzolo"), featured: false, description: "Handmade Italian tailoring with artisanal details." },
  { slug: "robert-graham", name: "Robert Graham", ...mediaFor("robert-graham"), featured: true, description: "Bold pattern-driven shirts and statement luxury pieces." },
  { slug: "stenstroms", name: "Stenstroms", ...mediaFor("stenstroms"), featured: false, description: "Premium Swedish shirting and knitwear craftsmanship." },
  { slug: "swims", name: "SWIMS", ...mediaFor("swims"), featured: false, description: "Weather-ready footwear and accessories with modern utility." },
  { slug: "tateossian", name: "Tateossian", ...mediaFor("tateossian"), featured: false, description: "Luxury cufflinks and accessories with architectural flair." },
  { slug: "ted-baker", name: "Ted Baker", ...mediaFor("ted-baker"), featured: false, description: "British contemporary menswear blending wit and tailoring." },
  { slug: "zanella", name: "Zanella", ...mediaFor("zanella"), featured: true, description: "Luxury Italian trousers engineered for fit and comfort." },
];

export const featuredBrands = brands.filter((brand) => brand.featured).slice(0, 24);
export const brandMap = Object.fromEntries(brands.map((brand) => [brand.slug, brand]));
