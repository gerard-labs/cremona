/**
 * cremona.js — Stimulus boot + controller register.
 *
 * Consumers use either:
 *  - Auto: `import { start } from '@gerard/cremona'` → kit boots its own
 *    Stimulus application on `document.documentElement`.
 *  - Manual: `import { register } from '@gerard/cremona'` → consumer
 *    provides its own Stimulus application (Symfony UX, custom boot)
 *    and registers the kit's controllers into it.
 *
 * `register()` wires every kit controller into a Stimulus application;
 * `boot()` / `start()` create one and register into it in a single call.
 */

import { Application } from '@hotwired/stimulus';

import AccordionController from './controllers/accordion_controller.js';
import AddressAutocompleteController from './controllers/address_autocomplete_controller.js';
import AlertDismissController from './controllers/alert-dismiss_controller.js';
import AvatarFallbackController from './controllers/avatar-fallback_controller.js';
import BackToTopController from './controllers/back_to_top_controller.js';
import CalendarController from './controllers/calendar_controller.js';
import CarouselController from './controllers/carousel_controller.js';
import ChartController from './controllers/chart_controller.js';
import ChatbotController from './controllers/chatbot_controller.js';
import CheckboxIndeterminateController from './controllers/checkbox-indeterminate_controller.js';
import CollapsibleController from './controllers/collapsible_controller.js';
import ColorPickerController from './controllers/color_picker_controller.js';
import ComboboxController from './controllers/combobox_controller.js';
import CommandController from './controllers/command_controller.js';
import ContextMenuController from './controllers/context-menu_controller.js';
import CookieBannerController from './controllers/cookie_banner_controller.js';
import DangerZoneController from './controllers/danger_zone_controller.js';
import DataTableController from './controllers/data-table_controller.js';
import DatePickerController from './controllers/date-picker_controller.js';
import DensitySwitcherController from './controllers/density_switcher_controller.js';
import DialogController from './controllers/dialog_controller.js';
import DrawerController from './controllers/drawer_controller.js';
import DropdownMenuController from './controllers/dropdown-menu_controller.js';
import FacetedFiltersController from './controllers/faceted_filters_controller.js';
import FileUploadController from './controllers/file-upload_controller.js';
import FormDateRangeController from './controllers/form_date_range_controller.js';
import FormWithStepsController from './controllers/form_with_steps_controller.js';
import HoverCardController from './controllers/hover-card_controller.js';
import InputGroupController from './controllers/input-group_controller.js';
import InputOtpController from './controllers/input-otp_controller.js';
import LangSwitcherController from './controllers/lang_switcher_controller.js';
import MenubarController from './controllers/menubar_controller.js';
import NavigationMenuController from './controllers/navigation-menu_controller.js';
import NumberInputController from './controllers/number-input_controller.js';
import PaginationController from './controllers/pagination_controller.js';
import PasswordStrengthController from './controllers/password_strength_controller.js';
import PhoneInputController from './controllers/phone_input_controller.js';
import PopoverController from './controllers/popover_controller.js';
import PreferencesCenterController from './controllers/preferences_center_controller.js';
import ProductTourController from './controllers/product_tour_controller.js';
import ResizableController from './controllers/resizable_controller.js';
import RolesMatrixController from './controllers/roles_matrix_controller.js';
import SelectController from './controllers/select_controller.js';
import SessionTimeoutCountdownController from './controllers/session_timeout_countdown_controller.js';
import SheetController from './controllers/sheet_controller.js';
import SidebarController from './controllers/sidebar_controller.js';
import SignaturePadController from './controllers/signature_pad_controller.js';
import SonnerController from './controllers/sonner_controller.js';
import SortableController from './controllers/sortable_controller.js';
import StepperController from './controllers/stepper_controller.js';
import TabsController from './controllers/tabs_controller.js';
import TagDismissController from './controllers/tag-dismiss_controller.js';
import TagInputController from './controllers/tag_input_controller.js';
import TextareaAutosizeController from './controllers/textarea-autosize_controller.js';
import ThemeSwitcherController from './controllers/theme_switcher_controller.js';
import ToggleController from './controllers/toggle_controller.js';
import ToggleGroupController from './controllers/toggle-group_controller.js';
import TooltipController from './controllers/tooltip_controller.js';

import { ensureSonnerViewport } from './utils/sonner-viewport.js';

/** @type {Record<string, typeof import('@hotwired/stimulus').Controller>} */
const controllers = {
  'accordion': AccordionController,
  'address-autocomplete': AddressAutocompleteController,
  'alert-dismiss': AlertDismissController,
  'avatar-fallback': AvatarFallbackController,
  'back-to-top': BackToTopController,
  'calendar': CalendarController,
  'carousel': CarouselController,
  'chart': ChartController,
  'chatbot': ChatbotController,
  'checkbox-indeterminate': CheckboxIndeterminateController,
  'collapsible': CollapsibleController,
  'color-picker': ColorPickerController,
  'combobox': ComboboxController,
  'command': CommandController,
  'context-menu': ContextMenuController,
  'cookie-banner': CookieBannerController,
  'danger-zone': DangerZoneController,
  'data-table': DataTableController,
  'date-picker': DatePickerController,
  'density-switcher': DensitySwitcherController,
  'dialog': DialogController,
  'drawer': DrawerController,
  'dropdown-menu': DropdownMenuController,
  'faceted-filters': FacetedFiltersController,
  'file-upload': FileUploadController,
  'form-date-range': FormDateRangeController,
  'form-with-steps': FormWithStepsController,
  'hover-card': HoverCardController,
  'input-group': InputGroupController,
  'input-otp': InputOtpController,
  'lang-switcher': LangSwitcherController,
  'menubar': MenubarController,
  'navigation-menu': NavigationMenuController,
  'number-input': NumberInputController,
  'pagination': PaginationController,
  'password-strength': PasswordStrengthController,
  'phone-input': PhoneInputController,
  'popover': PopoverController,
  'preferences-center': PreferencesCenterController,
  'product-tour': ProductTourController,
  'resizable': ResizableController,
  'roles-matrix': RolesMatrixController,
  'select': SelectController,
  'session-timeout-countdown': SessionTimeoutCountdownController,
  'sheet': SheetController,
  'sidebar': SidebarController,
  'signature-pad': SignaturePadController,
  'sonner': SonnerController,
  'sortable': SortableController,
  'stepper': StepperController,
  'tabs': TabsController,
  'tag-dismiss': TagDismissController,
  'tag-input': TagInputController,
  'textarea-autosize': TextareaAutosizeController,
  'theme-switcher': ThemeSwitcherController,
  'toggle': ToggleController,
  'toggle-group': ToggleGroupController,
  'tooltip': TooltipController,
};

/**
 * Register all kit controllers into an existing Stimulus application.
 * @param {Application} application
 * @returns {Application}
 */
export function register(application) {
  for (const [identifier, ControllerClass] of Object.entries(controllers)) {
    application.register(identifier, ControllerClass);
  }
  return application;
}

/**
 * Boot a fresh Stimulus application on the given root and register
 * kit controllers into it. Idempotent if called multiple times on the
 * same root (returns the existing instance).
 *
 * @param {HTMLElement} root
 * @returns {Application}
 */
export function boot(root = document.documentElement) {
  if (root.dataset.themeBooted === '1' && root.__themeApp) {
    return root.__themeApp;
  }
  const application = Application.start(root);
  register(application);
  // Inject the Sonner toast viewport into <body> so consumers can call
  // window.themeToast.show(...) immediately after boot(). Idempotent —
  // multiple boot() calls leave a single viewport in DOM.
  ensureSonnerViewport();
  root.__themeApp = application;
  root.dataset.themeBooted = '1';
  return application;
}

/** Convenience auto-boot: starts on document.documentElement. */
export function start() {
  return boot(document.documentElement);
}

export { Application };
export { ensureSonnerViewport };
