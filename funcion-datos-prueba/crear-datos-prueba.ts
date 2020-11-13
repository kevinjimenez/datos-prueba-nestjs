import { ParametrosCrearDatosPrueba } from '../interfaces/parametros-crear-datos-prueba';
import { Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import * as path from 'path';
import { readdir, readdirSync, readFileSync } from 'fs';
import { ParametrosValidacionDto } from '../interfaces/parametros-validacion-dto';

export async function CrearDatosPrueba(parametros: ParametrosCrearDatosPrueba) {
  const logger = new Logger('Crear datos');
  const arregloArchivos = readdirSync('src/' + parametros.rutaDatos);
  const sinArchivos = arregloArchivos.length < 0;
  if (!sinArchivos) {
    let registrosParseados: [];
    if (!parametros.produccion) {
      registrosParseados = parceDatosPrueba(parametros.rutaDatos, 'datos-prueba.dev.json');
      await crearRegistroBase(registrosParseados, parametros);
    } else {
      registrosParseados = parceDatosPrueba(parametros.rutaDatos, 'datos-prueba.json');
      await crearRegistroBase(registrosParseados, parametros);
    }
  } else {
    logger.error('Sin archivos en datos de prueba!');
  }
}

function parceDatosPrueba(ruta: string, nombreArchivo: string) {
  const rutaDatosPrueba = `src/${ruta}/${nombreArchivo}`;
  const registrosParseados = JSON.parse(
    readFileSync(rutaDatosPrueba, 'utf-8').toString(),
  );
  return registrosParseados;
}

async function validarDatosPrueba(arregloDatos: [], createDto) {
  const logger = new Logger('Crear datos');
  const existenDatos = arregloDatos.length > 0;
  let arregloPropiedadJson: string[];
  let erroresDtos: any[];
  if (existenDatos) {
    for (const item of arregloDatos) {
      arregloPropiedadJson = Object.keys(item);
      createDto = crearDtoRegistro(item, arregloPropiedadJson, createDto);
      erroresDtos = await validate(createDto);
      if (erroresDtos.length) {
        return true;
      }
    }
    return false;
  } else {
    logger.error('No existen datos de prueba!');
  }
}

function crearDtoRegistro(item, arregloPropiedadesJson: string[], dto) {
  arregloPropiedadesJson
    .forEach(
      key => {
        dto[key] = item[key];
      },
    );
  return dto;
}

async function crearRegistroBase(registrosParseados, parametros: ParametrosCrearDatosPrueba) {
  const erroresDatos = await validarDatosPrueba(registrosParseados, parametros.createDto);
  if (erroresDatos) {
    const logger = new Logger('ERROR CREANDO DATOS!');
    console.log('Errores');
  } else {
    const registrosCreados = await parametros.servicio.createMany(registrosParseados);
    console.log('Sin Errores');
  }

}
