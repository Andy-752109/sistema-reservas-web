import { pedir } from '../api/cliente'
import { crearApiEspacios } from '../espacios/api-espacios'
import Catalogo from './Catalogo'

const apiEspacios = crearApiEspacios(pedir)

export default function PaginaCatalogo() {
  return <Catalogo api={apiEspacios} />
}