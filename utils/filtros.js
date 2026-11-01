import { CATEGORIAS, RANGOS, TIPOS } from '../config/filtros';
import { formatearFecha as legible } from './fechas';

// Saca los campos vacíos (undefined, null, '') para no mandar parámetros en blanco.
export const sinVacios = (objeto) => {
  const resultado = {};
  Object.keys(objeto).forEach((clave) => {
    const valor = objeto[clave];
    if (valor !== undefined && valor !== null && valor !== '') {
      resultado[clave] = valor;
    }
  });
  return resultado;
};

const etiqueta = (lista, valor) => lista.find((opcion) => opcion.value === valor)?.label;

// Texto corto que describe una búsqueda: "Perdí algo · Llaves · Palermo · Hoy"
export const resumenFiltros = (filtros) => {
  const partes = [];
  const tipo = etiqueta(TIPOS, filtros.tipo);
  if (tipo) partes.push(tipo);
  const categoria = etiqueta(CATEGORIAS, filtros.categoria);
  if (categoria) partes.push(categoria);
  if (filtros.palabrasClave) partes.push(`"${filtros.palabrasClave}"`);
  if (filtros.barrio) partes.push(filtros.barrio);
  if (filtros.rango === 'RANGO') {
    partes.push(`${legible(filtros.fechaDesde)} - ${legible(filtros.fechaHasta)}`);
  } else {
    const rango = etiqueta(RANGOS, filtros.rango);
    if (rango) partes.push(rango);
  }
  return partes.join(' · ');
};