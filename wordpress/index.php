<?php
/**
 * GSLEY default index template — fallback for any non-front, non-page route.
 * Standard WordPress loop with light styling so blog posts work out of the box.
 */
get_header();
?>
<main class="gsley-page">
    <?php if ( have_posts() ) : ?>
        <?php while ( have_posts() ) : the_post(); ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                <h1><?php the_title(); ?></h1>
                <div><?php the_content(); ?></div>
            </article>
        <?php endwhile; ?>
    <?php else : ?>
        <h1>Nothing here.</h1>
        <p>This page doesn't exist.</p>
    <?php endif; ?>
</main>
<?php get_footer(); ?>
