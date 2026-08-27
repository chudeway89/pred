<?php
/**
 * GSLEY header — used by index.php and page.php.
 * The front page renders front-page.php directly without this header.
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<header class="gsley-page-nav">
    <a href="<?php echo esc_url( home_url( '/' ) ); ?>" style="display:flex;align-items:center;gap:10px;">
        <svg width="28" height="28" viewBox="0 0 36 36" aria-label="GSLEY">
            <path d="M27 9.5 A11 11 0 1 0 28 24 L28 18.5 L19.5 18.5" fill="none" stroke="#0F1B2D" stroke-width="3" stroke-linecap="square"/>
        </svg>
        <span style="font-weight:800;letter-spacing:2px;">GSLEY</span>
    </a>
    <nav>
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>">← Back to site</a>
    </nav>
</header>
