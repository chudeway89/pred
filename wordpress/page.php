<?php
/**
 * GSLEY page template — for any standard WordPress page (e.g. Privacy Policy,
 * Terms, Careers postings) added through the WP admin.
 */
get_header();
?>
<main class="gsley-page">
    <?php while ( have_posts() ) : the_post(); ?>
        <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
            <h1><?php the_title(); ?></h1>
            <div><?php the_content(); ?></div>
        </article>
    <?php endwhile; ?>
</main>
<?php get_footer(); ?>
