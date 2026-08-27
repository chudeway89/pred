<?php
/**
 * GSLEY front-page template — renders the bundled GSLEY application.
 *
 * The full React-driven site lives in /assets/gsley-app.html. functions.php
 * extracts <head> contents into wp_head(); here we extract <body> and emit it.
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php
$parts = gsley_get_app_parts();
echo $parts['body'];
wp_footer();
?>
</body>
</html>
