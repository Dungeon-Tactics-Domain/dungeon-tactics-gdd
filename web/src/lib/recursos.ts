// Switch for the decision UI inside the labs, paused on 15/11 by Fernando's request: the asset decision box
// (DecisaoAsset), the "Decisões" page and menu link, the music stars and the narrative Quero / Não quero marks
// (with the pages that only exist for them). Nothing is deleted (components, API client, Rust API, types and tests
// stay); with false they render nothing, hide their links and make no calls.
// To turn it back on, set this to true. Tests that cover the behaviour mock this module with true.
export const DECISOES_ATIVAS = false;
