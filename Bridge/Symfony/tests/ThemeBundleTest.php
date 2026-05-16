<?php

declare(strict_types=1);

namespace Gerard\Theme\Bridge\Symfony\Tests;

use Gerard\Theme\Bridge\Symfony\DependencyInjection\ThemeExtension;
use Gerard\Theme\Bridge\Symfony\ThemeBundle;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\ContainerBuilder;

/**
 * Smoke test for the ThemeBundle's wiring (Ring 1 lock-in — ADR-0008).
 *
 * Verifies the bundle's Extension::prepend() correctly:
 *   1. Registers the @theme Twig namespace pointing at <pkg>/src/templates/.
 *   2. Registers the kit's src/js/i18n/ directory under
 *      framework.translator.paths so consumers' Symfony Translator
 *      auto-discovers fr.json / en.json.
 *
 * Does NOT boot a full Kernel — the prepend() is the contract surface we care
 * about; downstream Translator catalogue resolution is Symfony's job, not ours
 * to re-test here.
 */
final class ThemeBundleTest extends TestCase
{
    public function test_bundle_extension_class_is_resolvable(): void
    {
        $bundle = new ThemeBundle();
        $extension = $bundle->getContainerExtension();
        self::assertInstanceOf(ThemeExtension::class, $extension);
        self::assertSame('theme', $extension->getAlias());
    }

    public function test_prepend_registers_twig_theme_namespace(): void
    {
        $container = new ContainerBuilder();
        $extension = new ThemeExtension();
        $extension->prepend($container);

        $twigConfigs = $container->getExtensionConfig('twig');
        self::assertNotEmpty($twigConfigs, 'Extension::prepend should add twig config');

        $paths = $twigConfigs[0]['paths'] ?? [];
        $hasThemeNamespace = false;
        foreach ($paths as $path => $namespace) {
            if ('theme' === $namespace) {
                $hasThemeNamespace = true;
                self::assertStringEndsWith('/src/templates', $path);
                self::assertDirectoryExists($path);
                break;
            }
        }
        self::assertTrue($hasThemeNamespace, '@theme Twig namespace should be registered');
    }

    public function test_prepend_registers_translator_i18n_paths(): void
    {
        $container = new ContainerBuilder();
        $extension = new ThemeExtension();
        $extension->prepend($container);

        $frameworkConfigs = $container->getExtensionConfig('framework');
        self::assertNotEmpty($frameworkConfigs, 'Extension::prepend should add framework config');

        $paths = $frameworkConfigs[0]['translator']['paths'] ?? [];
        self::assertNotEmpty($paths, 'translator.paths should be non-empty');

        $i18nPath = $paths[0];
        self::assertStringEndsWith('/src/js/i18n', $i18nPath);
        self::assertDirectoryExists($i18nPath);
        self::assertFileExists($i18nPath.'/fr.json');
        self::assertFileExists($i18nPath.'/en.json');
    }

    public function test_load_does_not_set_ux_stimulus_parameter_when_bundle_absent(): void
    {
        // In the test environment, symfony/ux-stimulus-bundle is NOT installed,
        // so the parameter should NOT be set.
        $container = new ContainerBuilder();
        $extension = new ThemeExtension();
        $extension->load([], $container);

        self::assertFalse($container->hasParameter('theme.ux_stimulus_bundle_present'));
    }
}
