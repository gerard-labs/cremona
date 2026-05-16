<?php

declare(strict_types=1);

namespace Gerard\Theme\Bridge\Symfony\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;

/**
 * Registers the @theme Twig namespace + framework.translator.paths so the
 * Symfony Translator picks up the kit's fr.json / en.json catalogues
 * automatically.
 *
 * Consumers write:
 *
 *     {% include '@theme/components/typography/typography.html.twig'
 *                with { variant: 'h1', content: 'Bonjour'|trans } %}
 *
 *     // Or directly use the translation keys:
 *     {{ 'theme.common.actions.save'|trans }}     {# → "Enregistrer" / "Save" #}
 *
 * `getAlias()` is `theme` (drops the trailing "Bundle" + lowercases) — that
 * is the namespace consumer apps would use in `config/packages/theme.yaml`
 * if we ever expose a config tree. Today the bundle has zero config.
 *
 * Optional Stimulus integration: if `symfony/ux-stimulus-bundle` is installed,
 * a hint is logged in `load()` for the consumer to wire the kit's controllers
 * into their import-map. The actual auto-wire bridge is deferred — for now,
 * consumers manually `import { boot } from '@gerard/cremona'` in their app.js.
 */
final class ThemeExtension extends Extension implements PrependExtensionInterface
{
    public function load(array $configs, ContainerBuilder $container): void
    {
        $loader = new YamlFileLoader(
            $container,
            new FileLocator(__DIR__.'/../Resources/config'),
        );
        $loader->load('services.yaml');

        // Optional: hint at Stimulus integration when the UX bundle is present.
        // The actual import-map / controllers wiring is the consumer's call for
        // now (Ring 1 lock-in deferred this to a separate ADR — see ADR-0008).
        if (class_exists(\Symfony\UX\StimulusBundle\StimulusBundle::class)) {
            $container->setParameter('theme.ux_stimulus_bundle_present', true);
        }
    }

    public function prepend(ContainerBuilder $container): void
    {
        // 1. Twig — register the @theme namespace pointing at src/templates/.
        $container->prependExtensionConfig('twig', [
            'paths' => [
                $this->resolveTemplatesPath() => 'theme',
            ],
        ]);

        // 2. Translator — register the kit's i18n directory so fr.json / en.json
        //    are picked up automatically. The Translator looks for files named
        //    `<catalog>.<format>` (e.g. fr.json) inside any registered path.
        //    OQ-6 resolution (ADR-0008): ship in bloc at Ring-1 lock-in.
        $container->prependExtensionConfig('framework', [
            'translator' => [
                'paths' => [
                    $this->resolveI18nPath(),
                ],
            ],
        ]);
    }

    public function getAlias(): string
    {
        return 'theme';
    }

    /**
     * From this file at <pkg>/Bridge/Symfony/src/DependencyInjection/
     * back to <pkg>/src/templates/.
     */
    private function resolveTemplatesPath(): string
    {
        return \dirname(__DIR__, 4).'/src/templates';
    }

    /**
     * From this file at <pkg>/Bridge/Symfony/src/DependencyInjection/
     * back to <pkg>/src/js/i18n/.
     */
    private function resolveI18nPath(): string
    {
        return \dirname(__DIR__, 4).'/src/js/i18n';
    }
}
