// Product images supplied in match-3-game-1.0.0.zip; see SOURCES.md.
(function(root){
const items=[
  {
    "id": "ch_blossom",
    "family": "Chesterfield",
    "name": "Chesterfield Blossom",
    "src": "assets/catalog/ch_blossom.jpg"
  },
  {
    "id": "ch_blue",
    "family": "Chesterfield",
    "name": "Chesterfield Blue",
    "src": "assets/catalog/ch_blue.jpg"
  },
  {
    "id": "ch_compact",
    "family": "Chesterfield",
    "name": "Chesterfield Compact",
    "src": "assets/catalog/ch_compact.jpg"
  },
  {
    "id": "ch_exotic",
    "family": "Chesterfield",
    "name": "Chesterfield Exotic",
    "src": "assets/catalog/ch_exotic.jpg"
  },
  {
    "id": "ch_orig",
    "family": "Chesterfield",
    "name": "Chesterfield Original",
    "src": "assets/catalog/ch_orig.jpg"
  },
  {
    "id": "ch_premium",
    "family": "Chesterfield",
    "name": "Chesterfield Premium",
    "src": "assets/catalog/ch_premium.jpg"
  },
  {
    "id": "ch_summer",
    "family": "Chesterfield",
    "name": "Chesterfield Summer",
    "src": "assets/catalog/ch_summer.jpg"
  },
  {
    "id": "f_deep",
    "family": "Fiit",
    "name": "Fiit Deep",
    "src": "assets/catalog/f_deep.jpg"
  },
  {
    "id": "f_marine",
    "family": "Fiit",
    "name": "Fiit Marine",
    "src": "assets/catalog/f_marine.jpg"
  },
  {
    "id": "f_regular",
    "family": "Fiit",
    "name": "Fiit Regular",
    "src": "assets/catalog/f_regular.jpg"
  },
  {
    "id": "f_spring",
    "family": "Fiit",
    "name": "Fiit Spring",
    "src": "assets/catalog/f_spring.jpg"
  },
  {
    "id": "f_tropic",
    "family": "Fiit",
    "name": "Fiit Tropic",
    "src": "assets/catalog/f_tropic.jpg"
  },
  {
    "id": "f_viola",
    "family": "Fiit",
    "name": "Fiit Viola",
    "src": "assets/catalog/f_viola.jpg"
  },
  {
    "id": "h_amber",
    "family": "HEETS",
    "name": "HEETS Amber",
    "src": "assets/catalog/h_amber.jpg"
  },
  {
    "id": "h_apricity",
    "family": "HEETS",
    "name": "HEETS Apricity",
    "src": "assets/catalog/h_apricity.jpg"
  },
  {
    "id": "h_arbor",
    "family": "HEETS",
    "name": "HEETS Arbor",
    "src": "assets/catalog/h_arbor.jpg"
  },
  {
    "id": "h_bronze",
    "family": "HEETS",
    "name": "HEETS Bronze",
    "src": "assets/catalog/h_bronze.jpg"
  },
  {
    "id": "h_gold",
    "family": "HEETS",
    "name": "HEETS Gold",
    "src": "assets/catalog/h_gold.jpg"
  },
  {
    "id": "h_green",
    "family": "HEETS",
    "name": "HEETS Green",
    "src": "assets/catalog/h_green.jpg"
  },
  {
    "id": "h_purple",
    "family": "HEETS",
    "name": "HEETS Purple",
    "src": "assets/catalog/h_purple.jpg"
  },
  {
    "id": "h_ruby",
    "family": "HEETS",
    "name": "HEETS Ruby",
    "src": "assets/catalog/h_ruby.jpg"
  },
  {
    "id": "h_satin",
    "family": "HEETS",
    "name": "HEETS Satin",
    "src": "assets/catalog/h_satin.jpg"
  },
  {
    "id": "h_slate",
    "family": "HEETS",
    "name": "HEETS Slate",
    "src": "assets/catalog/h_slate.jpg"
  },
  {
    "id": "h_summer",
    "family": "HEETS",
    "name": "HEETS Summer",
    "src": "assets/catalog/h_summer.jpg"
  },
  {
    "id": "h_sun",
    "family": "HEETS",
    "name": "HEETS Sun",
    "src": "assets/catalog/h_sun.jpg"
  },
  {
    "id": "h_turq",
    "family": "HEETS",
    "name": "HEETS Turquoise",
    "src": "assets/catalog/h_turq.jpg"
  },
  {
    "id": "h_yuren",
    "family": "HEETS",
    "name": "HEETS Yuren",
    "src": "assets/catalog/h_yuren.jpg"
  },
  {
    "id": "lm_blue",
    "family": "L&M",
    "name": "L&M Blue",
    "src": "assets/catalog/lm_blue.jpg"
  },
  {
    "id": "lm_red",
    "family": "L&M",
    "name": "L&M Red",
    "src": "assets/catalog/lm_red.jpg"
  },
  {
    "id": "m_compact",
    "family": "Marlboro",
    "name": "Marlboro Compact",
    "src": "assets/catalog/m_compact.jpg"
  },
  {
    "id": "m_double",
    "family": "Marlboro",
    "name": "Marlboro Double",
    "src": "assets/catalog/m_double.jpg"
  },
  {
    "id": "m_forest",
    "family": "Marlboro",
    "name": "Marlboro Forest",
    "src": "assets/catalog/m_forest.jpg"
  },
  {
    "id": "m_garden",
    "family": "Marlboro",
    "name": "Marlboro Garden",
    "src": "assets/catalog/m_garden.jpg"
  },
  {
    "id": "m_gold",
    "family": "Marlboro",
    "name": "Marlboro Gold",
    "src": "assets/catalog/m_gold.jpg"
  },
  {
    "id": "m_red",
    "family": "Marlboro",
    "name": "Marlboro Red",
    "src": "assets/catalog/m_red.jpg"
  },
  {
    "id": "m_summer",
    "family": "Marlboro",
    "name": "Marlboro Summer",
    "src": "assets/catalog/m_summer.jpg"
  },
  {
    "id": "n_cps",
    "family": "NEO",
    "name": "NEO CPS",
    "src": "assets/catalog/n_cps.jpg"
  },
  {
    "id": "n_rose",
    "family": "NEO",
    "name": "NEO Rose",
    "src": "assets/catalog/n_rose.jpg"
  },
  {
    "id": "n_violet",
    "family": "NEO",
    "name": "NEO Violet",
    "src": "assets/catalog/n_violet.jpg"
  },
  {
    "id": "p_aqua",
    "family": "Parliament",
    "name": "Parliament Aqua",
    "src": "assets/catalog/p_aqua.jpg"
  },
  {
    "id": "p_night",
    "family": "Parliament",
    "name": "Parliament Night",
    "src": "assets/catalog/p_night.jpg"
  },
  {
    "id": "p_red",
    "family": "Parliament",
    "name": "Parliament Red",
    "src": "assets/catalog/p_red.jpg"
  },
  {
    "id": "p_silver",
    "family": "Parliament",
    "name": "Parliament Silver",
    "src": "assets/catalog/p_silver.jpg"
  },
  {
    "id": "p_slim",
    "family": "Parliament",
    "name": "Parliament Slim",
    "src": "assets/catalog/p_slim.jpg"
  },
  {
    "id": "p_soho",
    "family": "Parliament",
    "name": "Parliament Soho",
    "src": "assets/catalog/p_soho.jpg"
  },
  {
    "id": "p_voyage",
    "family": "Parliament",
    "name": "Parliament Voyage",
    "src": "assets/catalog/p_voyage.jpg"
  },
  {
    "id": "p_voyagemix",
    "family": "Parliament",
    "name": "Parliament Voyage Mix",
    "src": "assets/catalog/p_voyagemix.jpg"
  },
  {
    "id": "ph_blue",
    "family": "Philip Morris",
    "name": "Philip Morris Blue",
    "src": "assets/catalog/ph_blue.jpg"
  },
  {
    "id": "ph_breez",
    "family": "Philip Morris",
    "name": "Philip Morris Breeze",
    "src": "assets/catalog/ph_breez.jpg"
  },
  {
    "id": "ph_caribbean",
    "family": "Philip Morris",
    "name": "Philip Morris Caribbean",
    "src": "assets/catalog/ph_caribbean.jpg"
  },
  {
    "id": "ph_compact",
    "family": "Philip Morris",
    "name": "Philip Morris Compact",
    "src": "assets/catalog/ph_compact.jpg"
  },
  {
    "id": "ph_exotic",
    "family": "Philip Morris",
    "name": "Philip Morris Exotic",
    "src": "assets/catalog/ph_exotic.jpg"
  },
  {
    "id": "ph_expert",
    "family": "Philip Morris",
    "name": "Philip Morris Expert",
    "src": "assets/catalog/ph_expert.jpg"
  },
  {
    "id": "ph_expertplus",
    "family": "Philip Morris",
    "name": "Philip Morris Expert Plus",
    "src": "assets/catalog/ph_expertplus.jpg"
  },
  {
    "id": "ph_premium",
    "family": "Philip Morris",
    "name": "Philip Morris Premium",
    "src": "assets/catalog/ph_premium.jpg"
  },
  {
    "id": "ph_red",
    "family": "Philip Morris",
    "name": "Philip Morris Red",
    "src": "assets/catalog/ph_red.jpg"
  },
  {
    "id": "ph_soln",
    "family": "Philip Morris",
    "name": "Philip Morris Солнечный",
    "src": "assets/catalog/ph_soln.jpg"
  },
  {
    "id": "ph_yarkiy",
    "family": "Philip Morris",
    "name": "Philip Morris Яркий",
    "src": "assets/catalog/ph_yarkiy.jpg"
  }
];
if(typeof module!=='undefined')module.exports=items;else root.BrandCatalog=items;
})(typeof window!=='undefined'?window:globalThis);
