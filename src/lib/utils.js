export function formatCurrency(num) {
  return num ? Number(num).toLocaleString('ko-KR') : '0'
}

export function formatDate(dateString) {
  return dateString ? dateString.replace(/-/g, '.') : '-'
}

export function extractNumber(str) {
  return Number(str.toString().replace(/,/g, '')) || 0
}

export function calculateProgress(project) {
  const today = new Date().toISOString().split('T')[0]
  const amount = Number(project.amount) || 0
  const advance = Number(project.advance) || 0
  let steps = []
  steps.push(project.date)
  steps.push(project.advanceDate)
  if (project.outCompany) {
    steps.push(project.outAdvanceDate)
    steps.push(project.outBalanceDate)
  }
  if (amount > advance) steps.push(project.balanceDate)
  steps.push(project.taxDate)
  let completed = 0
  steps.forEach(d => { if (d && d <= today) completed++ })
  return Math.round((completed / steps.length) * 100) || 0
}

export const DEFAULT_CATEGORIES = [
  { name: '홈페이지', color: '#16a34a', icon: 'fa-desktop' },
  { name: '편집디자인', color: '#f59e0b', icon: 'fa-pen' },
  { name: '영상', color: '#8b5cf6', icon: 'fa-video' },
  { name: '유지보수', color: '#3b82f6', icon: 'fa-wrench' },
]

export const FA_ICONS = [
  'fa-house','fa-user','fa-users','fa-check','fa-xmark','fa-plus','fa-minus',
  'fa-star','fa-heart','fa-circle','fa-square','fa-trash','fa-trash-can',
  'fa-pen','fa-pen-to-square','fa-gear','fa-gears','fa-bell','fa-envelope',
  'fa-phone','fa-file','fa-folder','fa-folder-open','fa-magnifying-glass',
  'fa-arrow-right','fa-arrow-left','fa-arrow-up','fa-arrow-down',
  'fa-arrow-pointer','fa-arrows-rotate','fa-arrow-right-arrow-left',
  'fa-rotate','fa-rotate-right','fa-rotate-left','fa-repeat',
  'fa-expand','fa-compress','fa-chevron-right','fa-chevron-left',
  'fa-sort','fa-sort-up','fa-sort-down',
  'fa-user-tie','fa-user-graduate','fa-user-secret','fa-user-plus',
  'fa-user-minus','fa-user-xmark','fa-user-check','fa-user-ninja',
  'fa-user-astronaut','fa-users-gear','fa-person','fa-person-dress',
  'fa-person-walking','fa-person-running','fa-person-biking',
  'fa-face-smile','fa-face-grin','fa-face-laugh','fa-face-meh',
  'fa-face-frown','fa-face-angry','fa-face-sad-tear',
  'fa-hand','fa-hand-pointer','fa-hand-peace','fa-hand-holding',
  'fa-hand-holding-dollar','fa-hand-holding-heart','fa-handshake',
  'fa-thumbs-up','fa-thumbs-down',
  'fa-sun','fa-moon','fa-cloud','fa-snowflake','fa-fire','fa-droplet',
  'fa-bolt','fa-wind','fa-leaf','fa-tree','fa-seedling',
  'fa-dog','fa-cat','fa-horse','fa-fish','fa-dove','fa-frog','fa-crow','fa-bug',
  'fa-mug-hot','fa-wine-glass','fa-burger','fa-pizza-slice','fa-utensils',
  'fa-carrot','fa-lemon','fa-egg','fa-bread-slice','fa-cake-candles',
  'fa-car','fa-car-side','fa-bus','fa-truck','fa-bicycle','fa-motorcycle',
  'fa-plane','fa-ship','fa-helicopter','fa-rocket','fa-taxi','fa-train','fa-train-subway',
  'fa-cart-shopping','fa-cart-plus','fa-bag-shopping','fa-basket-shopping',
  'fa-credit-card','fa-money-bill','fa-money-bill-wave','fa-coins',
  'fa-wallet','fa-piggy-bank','fa-receipt','fa-cash-register',
  'fa-store','fa-shop','fa-gift','fa-box-open','fa-truck-fast',
  'fa-file-invoice','fa-file-invoice-dollar',
  'fa-book','fa-book-open','fa-graduation-cap','fa-briefcase',
  'fa-building','fa-hospital','fa-school','fa-landmark','fa-flag',
  'fa-wrench','fa-screwdriver-wrench','fa-hammer','fa-key','fa-lock',
  'fa-unlock','fa-shield','fa-anchor','fa-link','fa-link-slash','fa-paperclip',
  'fa-clock','fa-calendar','fa-calendar-days','fa-hourglass',
  'fa-globe','fa-map','fa-location-dot','fa-compass','fa-map-pin','fa-route','fa-road',
  'fa-image','fa-camera','fa-video','fa-music','fa-film','fa-ticket',
  'fa-microphone','fa-podcast','fa-radio','fa-guitar','fa-drum','fa-headphones','fa-tv','fa-gamepad',
  'fa-desktop','fa-laptop','fa-mobile','fa-tablet','fa-keyboard',
  'fa-mouse','fa-print','fa-server','fa-database','fa-code','fa-terminal',
  'fa-wifi','fa-plug','fa-battery-full','fa-battery-half','fa-battery-empty',
  'fa-power-off','fa-cloud-arrow-up','fa-cloud-arrow-down',
  'fa-file-lines','fa-file-pdf','fa-file-word','fa-file-excel',
  'fa-file-powerpoint','fa-file-image','fa-file-audio','fa-file-video',
  'fa-file-zipper','fa-file-code','fa-file-medical','fa-clipboard','fa-copy','fa-scissors',
  'fa-font','fa-bold','fa-italic','fa-underline',
  'fa-align-left','fa-align-center','fa-align-right','fa-align-justify',
  'fa-chart-bar','fa-chart-line','fa-chart-pie','fa-chart-simple',
  'fa-list','fa-table','fa-tag','fa-bookmark','fa-filter',
  'fa-share','fa-reply','fa-download','fa-upload','fa-eye','fa-eye-slash','fa-comments','fa-message',
  'fa-bed','fa-bath','fa-shower','fa-toilet','fa-couch','fa-chair','fa-lightbulb','fa-fan','fa-faucet',
  'fa-stethoscope','fa-syringe','fa-pills','fa-tooth','fa-bone','fa-dna','fa-virus','fa-heart-pulse',
  'fa-scale-balanced','fa-gavel','fa-passport','fa-id-card','fa-id-badge','fa-address-card','fa-address-book',
  'fa-circle-info','fa-circle-question','fa-circle-exclamation','fa-circle-check','fa-circle-xmark',
  'fa-triangle-exclamation','fa-square-check','fa-square-xmark','fa-square-plus','fa-square-minus',
  'fa-bars','fa-ellipsis','fa-ellipsis-vertical','fa-grip-lines','fa-grip-vertical',
  'fa-magnifying-glass-plus','fa-magnifying-glass-minus',
]
