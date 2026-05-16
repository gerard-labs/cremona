<!--
  RolesMatrix story — 4 viewport variants (Light/Dark × LTR/RTL).
  Variants : default · bulk-edit-on · empty.

  55th Ring 3 pattern (post-Ring-3-lock-in per ADR-0042).
  All visible strings via t('theme.roles-matrix.story.sample.<key>').
-->
<script setup>
import { onMounted } from 'vue';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderMatrix({ bulkEdit = false, empty = false } = {}) {
  const members = empty ? [] : [
    { id: 'u1', name: 'Marie Dupont' },
    { id: 'u2', name: 'Pierre Bernard' },
    { id: 'u3', name: 'Sophie Martin' },
    { id: 'u4', name: 'Jean Dubois' },
  ];
  const permissions = [
    { id: 'read',   label: t('theme.roles-matrix.story.sample.perm.read') },
    { id: 'write',  label: t('theme.roles-matrix.story.sample.perm.write') },
    { id: 'admin',  label: t('theme.roles-matrix.story.sample.perm.admin') },
    { id: 'bill',   label: t('theme.roles-matrix.story.sample.perm.billing') },
  ];
  const cells = {
    u1: { read: 'admin',  write: 'admin',  admin: 'admin',  bill: 'admin' },
    u2: { read: 'member', write: 'member', admin: 'none',   bill: 'viewer' },
    u3: { read: 'member', write: 'viewer', admin: 'none',   bill: 'none' },
    u4: { read: 'viewer', write: 'none',   admin: 'none',   bill: 'none' },
  };
  const roleLabel = (v) => t('theme.roles-matrix.story.sample.role.' + v);
  const roleVariant = (v) => v === 'admin' ? 'success' : (v === 'member' ? 'default' : (v === 'viewer' ? 'info' : 'muted'));

  const toolbar = `
    <div class="cremona-roles-matrix__toolbar">
      <button type="button" class="cremona-button" data-variant="${bulkEdit ? 'primary' : 'secondary'}" data-size="sm" aria-pressed="${bulkEdit}">${t('theme.roles-matrix.bulk-edit.label')}</button>
    </div>
  `;

  if (empty) {
    return `<div class="cremona-roles-matrix">${toolbar}<div class="cremona-roles-matrix__scroll-wrap" style="padding:2rem;text-align:center;"><p class="cremona-typography" data-variant="body" data-color="secondary">${t('theme.roles-matrix.story.sample.empty')}</p></div></div>`;
  }

  const colHeaders = permissions.map(p => `<th scope="col" class="cremona-roles-matrix__col-header">${p.label}</th>`).join('');
  const rows = members.map(m => `
    <tr>
      <th scope="row" class="cremona-roles-matrix__row-header"><span class="cremona-roles-matrix__member-name">${m.name}</span></th>
      ${permissions.map(p => {
        const r = cells[m.id][p.id] || 'none';
        return `<td class="cremona-roles-matrix__cell" role="button" tabindex="0"><span class="cremona-badge" data-variant="${roleVariant(r)}">${roleLabel(r)}</span></td>`;
      }).join('')}
    </tr>
  `).join('');

  return `
    <div class="cremona-roles-matrix" data-roles-matrix-bulk-edit-value="${bulkEdit}">
      ${toolbar}
      <div class="cremona-roles-matrix__scroll-wrap">
        <table class="cremona-table cremona-roles-matrix__table" data-size="md">
          <caption class="sr-only">${t('theme.roles-matrix.story.sample.caption')}</caption>
          <thead><tr><th scope="col" class="cremona-roles-matrix__corner"><span class="sr-only">${t('theme.roles-matrix.aria.corner')}</span></th>${colHeaders}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

const defaultHtml = renderMatrix();
const bulkHtml = renderMatrix({ bulkEdit: true });
const emptyHtml = renderMatrix({ empty: true });

onMounted(() => boot(document.documentElement));
</script>

<template>
  <Story title="Patterns/RolesMatrix" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Default — Light · LTR"><div dir="ltr" v-html="defaultHtml" style="padding:1rem;"></div></Variant>
    <Variant title="Default — Light · RTL"><div dir="rtl" v-html="defaultHtml" style="padding:1rem;"></div></Variant>
    <Variant title="Default — Dark · LTR"><div data-theme="dark" dir="ltr" v-html="defaultHtml" style="padding:1rem;"></div></Variant>
    <Variant title="Bulk-edit mode"><div dir="ltr" v-html="bulkHtml" style="padding:1rem;"></div></Variant>
    <Variant title="Empty"><div dir="ltr" v-html="emptyHtml" style="padding:1rem;"></div></Variant>
  </Story>
</template>

<style>
.cremona-roles-matrix { color: var(--color-text-primary); }
</style>
