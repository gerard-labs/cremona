<?php

declare(strict_types=1);

namespace Gerard\Theme\Bridge\Symfony\Tests;

use Gerard\Theme\Bridge\Symfony\DependencyInjection\ThemeExtension;
use Gerard\Theme\Bridge\Symfony\ThemeBundle;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Bundle\Bundle;

/**
 * Tests for the bundle shell itself — that it is a well-formed Symfony
 * bundle and exposes the kit's DI extension. The extension's behaviour is
 * covered separately in {@see ThemeExtensionTest}.
 */
final class ThemeBundleTest extends TestCase
{
    public function test_is_a_symfony_bundle(): void
    {
        self::assertInstanceOf(Bundle::class, new ThemeBundle());
    }

    public function test_exposes_the_theme_extension(): void
    {
        $extension = (new ThemeBundle())->getContainerExtension();

        self::assertInstanceOf(ThemeExtension::class, $extension);
        self::assertSame('theme', $extension->getAlias());
    }

    public function test_path_resolves_to_an_existing_directory(): void
    {
        $path = (new ThemeBundle())->getPath();

        self::assertDirectoryExists($path);
        self::assertStringContainsString('Bridge', $path);
    }
}
