<?php
/**
 * GSLEY Theme functions.
 */

// Theme setup
function gsley_theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );

    register_nav_menus( array(
        'primary' => __( 'Primary Menu', 'gsley' ),
    ) );
}
add_action( 'after_setup_theme', 'gsley_theme_setup' );

// Enqueue stylesheet
function gsley_enqueue_assets() {
    wp_enqueue_style( 'gsley-style', get_stylesheet_uri(), array(), '1.0.0' );
}
add_action( 'wp_enqueue_scripts', 'gsley_enqueue_assets' );

/**
 * Helper: read the bundled GSLEY app HTML and return only the inner contents
 * of <body>...</body>, plus all <link>/<style>/<script> nodes from <head>.
 *
 * The bundled app is a complete <!doctype html> document; we extract the parts
 * we need so it can be rendered inside WordPress's wp_head() / wp_footer()
 * envelope on the front page only.
 */
function gsley_get_app_parts() {
    $bundle_path = get_template_directory() . '/assets/gsley-app.html';
    if ( ! file_exists( $bundle_path ) ) {
        return array( 'head' => '', 'body' => '<p>GSLEY application bundle not found at /assets/gsley-app.html.</p>' );
    }
    $html = file_get_contents( $bundle_path );

    $head = '';
    if ( preg_match( '/<head[^>]*>(.*?)<\/head>/is', $html, $m ) ) {
        $head = $m[1];
    }
    $body = '';
    if ( preg_match( '/<body[^>]*>(.*?)<\/body>/is', $html, $m ) ) {
        $body = $m[1];
    }
    return array( 'head' => $head, 'body' => $body );
}

// Inject bundled app's <head> contents only on the front page
function gsley_inject_head() {
    if ( ! ( is_front_page() && is_home() ) && ! is_front_page() ) return;
    $parts = gsley_get_app_parts();
    echo $parts['head'];
}
add_action( 'wp_head', 'gsley_inject_head', 99 );

// Disable admin bar for front page (so the embedded app gets full viewport)
function gsley_admin_bar_front_page( $show ) {
    if ( is_front_page() ) return false;
    return $show;
}
add_filter( 'show_admin_bar', 'gsley_admin_bar_front_page' );
