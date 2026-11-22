// Ikigai para Windows: una ventana nativa que carga la app desde los archivos locales (sin internet).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("no se pudo iniciar Ikigai");
}
