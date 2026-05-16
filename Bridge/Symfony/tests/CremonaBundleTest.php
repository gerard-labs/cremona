<?php

declare(strict_types=1);

namespace Gerard\Cremona\Bridge\Symfony\Tests;

use Gerard\Cremona\Bridge\Symfony\DependencyInjection\CremonaExtension;
use Gerard\Cremona\Bridge\Symfony\CremonaBundle;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Bundle\Bundle;

/**
 * Tests for the bundle shell itself — that it is a well-formed Symfony
 * bundle and exposes the kit's DI extension. The extension's behaviour is
 * covered separately in {@see CremonaExtensionTest}.
 */
final class CremonaBundleTest extends TestCase
{
    public function test_is_a_symfony_bundle(): void
    {
        self::assertInstanceOf(Bundle::class, new CremonaBundle());
    }

    public function test_exposes_the_theme_extension(): void
    {
        $extension = (new CremonaBundle())->getContainerExtension();

        self::assertInstanceOf(CremonaExtension::class, $extension);
        self::assertSame('cremona', $extension->getAlias());
    }

    public function test_path_resolves_to_an_existing_directory(): void
    {
        $path = (new CremonaBundle())->getPath();

        self::assertDirectoryExists($path);
        self::assertStringContainsString('Bridge', $path);
    }
}
