Fuente: Natural Earth, 1:10m Cultural Vectors, Admin 1 – States, Provinces
(`ne_10m_admin_1_states_provinces`), dominio público.
https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
Copia GeoJSON: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_1_states_provinces.geojson

`public/maps/peru-departments.geojson` se genera con `scripts/build-peru-map.mjs`:
filtra `adm0_a3 = PER` (26 regiones), asigna el código INEI de dos dígitos por
nombre y simplifica con mapshaper (Visvalingam 20 %, conserva formas, quita
islas < 20 km², orientación RFC 7946). Natural Earth separa «Lima Province»
(Lima Metropolitana, código interno `LM`) de Lima Región (`15`); el checkout
trata Lima Metropolitana y el Callao (`07`) como delivery. Solo colorea la
vista país del mapa de agencias; las calles vienen de OpenFreeMap
(OpenMapTiles + OpenStreetMap, atribución automática de MapLibre).
No editar el archivo generado a mano.
