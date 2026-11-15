# Contrato da API da fábrica (Rust <-> React)

Fonte: scripts/fabrica-sync.mjs do lab atual (the previous plain-TypeScript lab). Estes tipos nascem no Rust (crates/labs-core) e são gerados para TypeScript com ts-rs em web/src/types/generated/.

- GET /api/fabrica -> Fabrica
- GET /api/fabrica/stream -> Server-Sent Events; evento `fabrica` com o JSON de Fabrica inteiro a cada mudança; evento `ping` a cada 15 s.

```
Fabrica { atualizado: string (ISO), aviso?: string, estacoes: Estacao[], subagentes: Subagente[] }
Estacao { id, nome, emoji, papel, estado: Estado, tarefa, pergunta?: string, sessao: string }
Subagente { id, nome, modelo, estacao: string (id da estação), estado: Estado, tarefa, inicio?: string, fim?: string }
Estado = "rodando" | "ocioso" | "espera" | "aguardando-voce" | "terminado"
```
