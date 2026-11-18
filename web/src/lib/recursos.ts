// Switch for the decision UI inside the labs, paused on 15/11 by Fernando's request: the asset decision box
// (DecisaoAsset), the "Decisões" page and menu link and the music stars (the narrative Quero / Não quero marks
// were removed on 17/11). Nothing else is deleted (components, API client, Rust API, types and tests
// stay); with false they render nothing, hide their links and make no calls.
// To turn it back on, set this to true. Tests that cover the behaviour mock this module with true.
export const DECISOES_ATIVAS = false;
