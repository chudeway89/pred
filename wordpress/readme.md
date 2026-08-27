# WordPress theme installation

1. Zip the contents of *this* folder (so `style.css` is at the root of the zip). Name it `gsley-theme.zip`.
2. In WordPress: **Appearance → Themes → Add New → Upload Theme**.
3. Upload, install, and activate.

The homepage renders the bundled GSLEY app. All other WordPress pages render through the standard `page.php` template and are editable in the WordPress block editor.

To edit the homepage application content, edit `assets/gsley-app.html` (or rebuild from `../source/`).
