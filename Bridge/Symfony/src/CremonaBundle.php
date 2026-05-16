<?php

declare(strict_types=1);

/*
 * Symfony Bundle minimal — registers the @cremona Twig namespace pointing at
 * <package>/src/templates/. Ring 1 S1.1 deliverable per OQ-4 in STATE.md.
 *
 * Deferred to S1.4 / Ring-1 lock-in (ADR-0007):
 *   - i18n (TranslationLoader for fr.json + en.json)
 *   - Stimulus auto-register (asset mapper hook)
 *   - PHPUnit tests
 */

namespace Gerard\Cremona\Bridge\Symfony;

use Symfony\Component\HttpKernel\Bundle\Bundle;

final class CremonaBundle extends Bundle
{
}
