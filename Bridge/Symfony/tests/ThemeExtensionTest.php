<?php

declare(strict_types=1);

namespace Gerard\Theme\Bridge\Symfony\Tests;

use Gerard\Theme\Bridge\Symfony\DependencyInjection\ThemeExtension;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\ContainerBuilder;

/**
 * Unit tests for the bundle's DI extension — the bridge's only real logic.
 *
 * `prepend()` is the contract surface: it wires the `@theme` Twig namespace
 * and the translation-catalog directory into the consumer's container.
 * `load()` loads the (currently empty) service definitions and, optionally,
 * flags the presence of symfony/ux-stimulus-bundle.
 */
final class ThemeExtensionTest extends TestCase
{
    public function test_alias_is_theme(): void
    {
        self::assertSame('theme', (new ThemeExtension())->getAlias());
    }

    public function test_load_executes_without_error(): void
    {
        $container = new ContainerBuilder();
        (new ThemeExtension())->load([], $container);

        // services.yaml currently declares no services — loading must still
        // succeed, and must NOT set the optional UX-Stimulus parameter while
        // symfony/ux-stimulus-bundle is absent (it is, in this test env).
        self::assertFalse($container->hasParameter('theme.ux_stimulus_bundle_present'));
    }

    public function test_prepend_registers_the_theme_twig_namespace(): void
    {
        $container = new ContainerBuilder();
        (new ThemeExtension())->prepend($container);

        $twigConfigs = $container->getExtensionConfig('twig');
        self::assertNotEmpty($twigConfigs, 'prepend() should contribute twig config');

        $paths = $twigConfigs[0]['paths'] ?? [];
        $themePath = array_search('theme', $paths, true);

        self::assertNotFalse($themePath, 'the @theme namespace should be registered');
        self::assertStringEndsWith(
            \DIRECTORY_SEPARATOR.'src'.\DIRECTORY_SEPARATOR.'templates',
            (string) $themePath,
        );
        self::assertDirectoryExists((string) $themePath);
    }

    public function test_theme_namespace_points_at_the_real_component_templates(): void
    {
        $container = new ContainerBuilder();
        (new ThemeExtension())->prepend($container);

        $paths = $container->getExtensionConfig('twig')[0]['paths'] ?? [];
        $themePath = (string) array_search('theme', $paths, true);

        // A consumer writing `{% include '@theme/components/button/button.html.twig' %}`
        // must resolve — so the registered directory has to hold the components.
        self::assertFileExists($themePath.'/components/button/button.html.twig');
    }

    public function test_prepend_registers_the_translation_catalog_path(): void
    {
        $container = new ContainerBuilder();
        (new ThemeExtension())->prepend($container);

        $frameworkConfigs = $container->getExtensionConfig('framework');
        self::assertNotEmpty($frameworkConfigs, 'prepend() should contribute framework config');

        $paths = $frameworkConfigs[0]['translator']['paths'] ?? [];
        self::assertNotEmpty($paths, 'translator.paths should be registered');

        $i18nPath = $paths[0];
        self::assertStringEndsWith(
            \DIRECTORY_SEPARATOR.'src'.\DIRECTORY_SEPARATOR.'js'.\DIRECTORY_SEPARATOR.'i18n',
            $i18nPath,
        );
        self::assertDirectoryExists($i18nPath);
    }

    public function test_translation_catalogs_are_discoverable(): void
    {
        $container = new ContainerBuilder();
        (new ThemeExtension())->prepend($container);

        $i18nPath = $container->getExtensionConfig('framework')[0]['translator']['paths'][0];

        // The Symfony Translator picks up `<catalog>.<format>` files — the kit
        // ships its fr/en catalogs as JSON in that directory.
        self::assertFileExists($i18nPath.'/fr.json');
        self::assertFileExists($i18nPath.'/en.json');
    }
}
