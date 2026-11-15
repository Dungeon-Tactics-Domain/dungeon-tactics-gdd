// Fábrica API types (docs/CONTRATO-FABRICA.md). They are born in Rust (crates/labs-core) and generated with ts-rs into
// ./generated/; every import in the app goes through '@/types/fabrica', so a contract change only touches the Rust side.
// Payloads are still rebuilt field by field by parseFabrica (lib/fabrica.ts): the types describe, they do not validate.
export type { Estacao } from './generated/Estacao';
export type { Estado } from './generated/Estado';
export type { Fabrica } from './generated/Fabrica';
export type { Subagente } from './generated/Subagente';
