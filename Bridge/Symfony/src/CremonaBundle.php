<?php

declare(strict_types=1);

/*
 * Symfony Bundle minimal — registers the @cremona Twig namespace pointing at
 * <package>/src/templates/.
 *
 * Deferred:
 *   - i18n (TranslationLoader for fr.json + en.json)
 *   - Stimulus auto-register (asset mapper hook)
 *   - PHPUnit tests
 */

namespace Gerard\Cremona\Bridge\Symfony;

use Symfony\Component\HttpKernel\Bundle\Bundle;

final class CremonaBundle extends Bundle
{
}
