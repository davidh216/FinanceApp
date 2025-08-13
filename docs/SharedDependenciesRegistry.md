# SHARED DEPENDENCIES REGISTRY - FinanceApp

## UI COMPONENTS

| Component | Purpose | Location | Used By | Last Updated | Status |
|-----------|---------|----------|---------|-------------|---------|
| Button | Primary CTA component | `/src/components/ui/Button.tsx` | Dashboard, AccountDetail | 2025-01-15 | ✅ Complete |
| AccountCard | Account display card | `/src/components/ui/AccountCard.tsx` | AccountOverview | 2025-01-15 | ✅ Complete |
| KPICard | KPI metric display | `/src/components/ui/KPICard.tsx` | KPISection | 2025-01-15 | ✅ Complete |
| TransactionItem | Transaction list item | `/src/components/ui/TransactionItem.tsx` | RecentActivity, AccountDetail | 2025-01-15 | ✅ Complete |
| DateRangePicker | Date selection | `/src/components/ui/DateRangePicker.tsx` | Dashboard | 2025-01-15 | ✅ Complete |
| LoadingSpinner | Loading indicator | `/src/components/ui/LoadingSpinner.tsx` | All components | 2025-01-15 | ✅ Complete |
| ErrorBoundary | Error catching | `/src/components/ui/ErrorBoundary.tsx` | App.tsx | 2025-01-15 | ✅ Complete |

## CHART COMPONENTS

| Component | Purpose | Location | Used By | Last Updated | Status |
|-----------|---------|----------|---------|-------------|---------|
| BaseChart | Foundation chart component | `/src/components/charts/BaseChart.tsx` | All chart components | 2025-01-15 | ✅ Complete |
| ChartFactory | Unified chart creation | `/src/components/charts/ChartFactory.tsx` | ChartContainer | 2025-01-15 | ✅ Complete |
| BalanceTrendChart | Balance over time line chart | `/src/components/charts/BalanceTrendChart.tsx` | Dashboard | 2025-01-15 | ✅ Complete |
| IncomeExpenseChart | Income vs expenses bar chart | `/src/components/charts/IncomeExpenseChart.tsx` | Dashboard | 2025-01-15 | ✅ Complete |
| CategorySpendingChart | Category breakdown doughnut chart | `/src/components/charts/CategorySpendingChart.tsx` | Dashboard | 2025-01-15 | ✅ Complete |
| ChartContainer | Chart wrapper with controls | `/src/components/charts/ChartContainer.tsx` | Dashboard | 2025-01-15 | ✅ Complete |

## CONTEXT PROVIDERS

| Provider | Purpose | Location | Used By | Last Updated | Status |
|----------|---------|----------|---------|-------------|---------|
| FinancialContext | Global financial state | `/src/contexts/FinancialContext.tsx` | All components | 2025-01-15 | ✅ Complete |
| AuthContext | Authentication state | `/src/contexts/AuthContext.tsx` | All components | 2025-01-15 | ✅ Complete |

## TYPE DEFINITIONS

| Type | Purpose | Location | Used By | Last Updated | Status |
|------|---------|----------|---------|-------------|---------|
| Account | Account data model | `/src/types/financial.ts` | All account components | 2025-01-15 | ✅ Complete |
| Transaction | Transaction data model | `/src/types/financial.ts` | All transaction components | 2025-01-15 | ✅ Complete |
| FinancialState | Global state interface | `/src/types/financial.ts` | FinancialContext | 2025-01-15 | ✅ Complete |
| FinancialAction | Action types | `/src/types/financial.ts` | FinancialContext | 2025-01-15 | ✅ Complete |
| FinancialSummary | Summary calculations | `/src/types/financial.ts` | KPISection, Dashboard | 2025-01-15 | ✅ Complete |
| DataService | Service interface | `/src/services/DataService.ts` | All services | 2025-01-15 | ✅ Complete |
| ApiResponse | API response wrapper | `/src/types/api.ts` | API hooks | 2025-01-15 | ✅ Complete |
| User | User data model | `/src/types/financial.ts` | AuthContext | 2025-01-15 | ✅ Complete |
| ChartProps | Chart component props | `/src/types/charts.ts` | All chart components | 2025-01-15 | ✅ Complete |
| ChartType | Chart type enum | `/src/components/charts/ChartFactory.tsx` | ChartFactory | 2025-01-15 | ✅ Complete |
| ChartConfig | Chart configuration | `/src/components/charts/ChartFactory.tsx` | ChartFactory | 2025-01-15 | ✅ Complete |

## CONSTANTS & CONFIGURATION

| Constant | Purpose | Location | Used By | Last Updated | Status |
|----------|---------|----------|---------|-------------|---------|
| MOCK_ACCOUNTS | Mock account data | `/src/constants/financial.ts` | FinancialContext | 2025-01-15 | ✅ Complete |
| TAG_CATEGORIES | Transaction categories | `/src/constants/financial.ts` | TransactionItem | 2025-01-15 | ✅ Complete |
| MERCHANT_PATTERNS | Merchant recognition | `/src/constants/financial.ts` | Transaction processing | 2025-01-15 | ✅ Complete |
| DEFAULT_PERIODS | Time period options | `/src/constants/financial.ts` | Dashboard, KPISection | 2025-01-15 | ✅ Complete |
| VALIDATION_RULES | Input validation | `/src/constants/financial.ts` | Form components | 2025-01-15 | ✅ Complete |
| API_ENDPOINTS | API endpoint constants | `/src/constants/api.ts` | API hooks | 2025-01-15 | ✅ Complete |
| FIREBASE_CONFIG | Firebase configuration | `/src/config/firebase.ts` | Firebase services | 2025-01-15 | ✅ Complete |
| CHART_COLORS | Chart color palette | `/src/constants/charts.ts` | All chart components | 2025-01-15 | ✅ Complete |

## UTILITY FUNCTIONS

| Function | Purpose | Location | Used By | Last Updated | Status |
|----------|---------|----------|---------|-------------|---------|
| generateMockTransactions | Mock data generation | `/src/constants/financial.ts` | MOCK_ACCOUNTS | 2025-01-15 | ✅ Complete |
| generateHistoricalTransactions | Historical data | `/src/constants/financial.ts` | MOCK_ACCOUNTS | 2025-01-15 | ✅ Complete |
| getSeasonalMultiplier | Seasonal patterns | `/src/constants/financial.ts` | Data generation | 2025-01-15 | ✅ Complete |
| getCategoryExpenseAmount | Category amounts | `/src/constants/financial.ts` | Data generation | 2025-01-15 | ✅ Complete |
| calculatePeriodBoundaries | Period calculations | `/src/utils/periodCalculations.ts` | Dashboard, KPISection | 2025-01-15 | ✅ Complete |
| filterTransactions | Transaction filtering | `/src/utils/transactionUtils.ts` | AccountDetail, RecentActivity | 2025-01-15 | ✅ Complete |
| formatCurrency | Currency formatting | `/src/utils/formatters.ts` | All components | 2025-01-15 | ✅ Complete |
| validateInput | Input validation | `/src/utils/validation.ts` | Form components | 2025-01-15 | ✅ Complete |
| migrateDataToFirebase | Data migration | `/src/utils/dataMigration.ts` | Firebase integration | 2025-01-15 | ✅ Complete |
| processChartData | Chart data processing | `/src/utils/chartUtils.ts` | All chart components | 2025-01-15 | ✅ Complete |
| exportToCSV | CSV export functionality | `/src/utils/exportUtils.ts` | Dashboard | 2025-01-15 | ✅ Complete |
| exportToJSON | JSON export functionality | `/src/utils/exportUtils.ts` | Dashboard | 2025-01-15 | ✅ Complete |

## SERVICE LAYER

| Service | Purpose | Location | Used By | Last Updated | Status |
|---------|---------|----------|---------|-------------|---------|
| DataService | Service interface | `/src/services/DataService.ts` | All services | 2025-01-15 | ✅ Complete |
| MockDataService | Mock implementation | `/src/services/DataService.ts` | Development | 2025-01-15 | ✅ Complete |
| FirebaseDataService | Firebase implementation | `/src/services/DataService.ts` | Production | 2025-01-15 | ✅ Complete |

## CUSTOM HOOKS

| Hook | Purpose | Location | Used By | Last Updated | Status |
|------|---------|----------|---------|-------------|---------|
| useApiCall | Generic API calls | `/src/hooks/useApiCall.ts` | All API operations | 2025-01-15 | ✅ Complete |
| useFirebaseService | Firebase service integration | `/src/hooks/useFirebaseService.ts` | Components | 2025-01-15 | ✅ Complete |
| useAuth | Authentication state | `/src/contexts/AuthContext.tsx` | All components | 2025-01-15 | ✅ Complete |
| useFinancial | Financial state | `/src/contexts/FinancialContext.tsx` | All components | 2025-01-15 | ✅ Complete |
| useCharts | Chart state management | `/src/hooks/useCharts.ts` | All chart components | 2025-01-15 | ✅ Complete |
| useDashboardData | Consolidated dashboard logic | `/src/hooks/useDashboardData.ts` | Dashboard | 2025-01-15 | ✅ Complete |
| usePerformanceOptimization | Performance utilities | `/src/hooks/usePerformanceOptimization.ts` | All components | 2025-01-15 | ✅ Complete |

## FIREBASE INTEGRATION

| Component | Purpose | Location | Used By | Last Updated | Status |
|-----------|---------|----------|---------|-------------|---------|
| Firebase Config | Firebase initialization | `/src/config/firebase.ts` | All Firebase services | 2025-01-15 | ✅ Complete |
| Auth Functions | Authentication utilities | `/src/config/firebase.ts` | AuthContext | 2025-01-15 | ✅ Complete |
| Firestore Helpers | Database utilities | `/src/config/firebase.ts` | DataService | 2025-01-15 | ✅ Complete |
| Collection References | Database collections | `/src/config/firebase.ts` | DataService | 2025-01-15 | ✅ Complete |

## API CONTRACTS (Implemented)

| Endpoint | Method | Purpose | Request Format | Response Format | Owner | Status |
|----------|--------|---------|----------------|-----------------|-------|---------|
| /api/accounts | GET | Get user accounts | - | Account[] | DataService | ✅ Complete |
| /api/accounts | POST | Create new account | Account | Account | DataService | ✅ Complete |
| /api/transactions | GET | Get transactions | FilterOptions | Transaction[] | DataService | ✅ Complete |
| /api/transactions/{id} | PUT | Update transaction | TransactionUpdate | Transaction | DataService | ✅ Complete |
| /api/summary | GET | Get financial summary | TimePeriod | FinancialSummary | DataService | ✅ Complete |
| /auth/google | POST | Google OAuth | - | User | AuthContext | ✅ Complete |
| /auth/signout | POST | Sign out user | - | boolean | AuthContext | ✅ Complete |
| /api/export/csv | GET | Export CSV data | FilterOptions | CSV file | ExportUtils | ✅ Complete |
| /api/export/json | GET | Export JSON data | FilterOptions | JSON file | ExportUtils | ✅ Complete |

## DATABASE SCHEMA (Implemented)

| Collection | Purpose | Key Fields | Relationships | Last Modified | Status |
|------------|---------|------------|---------------|---------------|---------|
| users | User profiles | id, email, name, settings | accounts[], transactions[] | 2025-01-15 | ✅ Complete |
| accounts | Bank accounts | id, userId, name, type, balance | transactions[], user | 2025-01-15 | ✅ Complete |
| transactions | Financial transactions | id, accountId, amount, date, category | account, tags[] | 2025-01-15 | ✅ Complete |
| categories | Transaction categories | id, name, icon, color | transactions[] | 2025-01-15 | ✅ Complete |

## NAVIGATION STRUCTURE

| Screen | Route | Parent | Children | Access Level | Status |
|--------|-------|---------|----------|-------------|---------|
| Dashboard | /dashboard | - | AccountDetail | Authenticated | ✅ Complete |
| AccountDetail | /accounts/:id | Dashboard | - | Authenticated | ✅ Complete |
| Login | /login | - | - | Public | ✅ Complete |
| Profile | /profile | Dashboard | - | Authenticated | 📋 Planned |

## STATE MANAGEMENT PATTERNS

| Pattern | Purpose | Location | Used By | Last Updated | Status |
|---------|---------|----------|---------|-------------|---------|
| useReducer | Global state management | FinancialContext | All components | 2025-01-15 | ✅ Complete |
| useMemo | Expensive calculations | Dashboard, KPISection | Performance optimization | 2025-01-15 | ✅ Complete |
| useState | Local component state | AccountDetail, Dashboard | Component state | 2025-01-15 | ✅ Complete |
| React.memo | Component memoization | UI components | Performance | 2025-01-15 | ✅ Complete |
| React.lazy | Code splitting | App.tsx | Bundle optimization | 2025-01-15 | ✅ Complete |
| Context API | Global state | FinancialContext, AuthContext | All components | 2025-01-15 | ✅ Complete |

## STYLING PATTERNS

| Pattern | Purpose | Location | Used By | Last Updated | Status |
|---------|---------|----------|---------|-------------|---------|
| Tailwind CSS | Utility-first styling | All components | All components | 2025-01-15 | ✅ Complete |
| Responsive Design | Mobile-first approach | All components | All components | 2025-01-15 | ✅ Complete |
| Color System | Consistent theming | Tailwind config | All components | 2025-01-15 | ✅ Complete |
| Chart Styling | Chart-specific styles | Chart components | Chart components | 2025-01-15 | ✅ Complete |

## ERROR HANDLING PATTERNS

| Pattern | Purpose | Location | Used By | Last Updated | Status |
|---------|---------|----------|---------|-------------|---------|
| Error Boundaries | React error catching | ErrorBoundary.tsx | All components | 2025-01-15 | ✅ Complete |
| Try-Catch | Async error handling | API hooks | API calls | 2025-01-15 | ✅ Complete |
| Error States | User-friendly errors | Dashboard | Error display | 2025-01-15 | ✅ Complete |
| Retry Logic | API retry mechanisms | useApiCall | Failed requests | 2025-01-15 | ✅ Complete |
| Firebase Error Handling | Firebase-specific errors | DataService | Firebase operations | 2025-01-15 | ✅ Complete |
| Chart Error Handling | Chart-specific errors | Chart components | Chart components | 2025-01-15 | ✅ Complete |

## TESTING PATTERNS

| Pattern | Purpose | Location | Used By | Last Updated | Status |
|---------|---------|----------|---------|-------------|---------|
| Unit Tests | Component testing | `/src/components/__tests__/` | All components | 2025-01-15 | ✅ Complete |
| Integration Tests | Component interaction | `/src/components/__tests__/` | Complex workflows | 2025-01-15 | ✅ Complete |
| Hook Tests | Custom hook testing | `/src/hooks/__tests__/` | All hooks | 2025-01-15 | ✅ Complete |
| Service Tests | Service layer testing | `/src/services/__tests__/` | All services | 2025-01-15 | ✅ Complete |
| Mock Data | Test data | `/src/constants/financial.ts` | All tests | 2025-01-15 | ✅ Complete |
| Firebase Emulator | Firebase testing | Test setup | Firebase tests | 2025-01-15 | ✅ Complete |
| Chart Tests | Chart component testing | `/src/components/charts/__tests__/` | Chart components | 2025-01-15 | ✅ Complete |

## PERFORMANCE PATTERNS

| Pattern | Purpose | Location | Used By | Last Updated | Status |
|---------|---------|----------|---------|-------------|---------|
| React.memo | Component memoization | UI components | Performance | 2025-01-15 | ✅ Complete |
| useMemo | Expensive calculations | Dashboard | Performance | 2025-01-15 | ✅ Complete |
| useCallback | Function memoization | Event handlers | Performance | 2025-01-15 | ✅ Complete |
| React.lazy | Code splitting | App.tsx | Bundle size | 2025-01-15 | ✅ Complete |
| Suspense | Loading boundaries | App.tsx | User experience | 2025-01-15 | ✅ Complete |
| Real-time Listeners | Live data updates | DataService | Real-time features | 2025-01-15 | ✅ Complete |
| Chart Optimization | Chart rendering optimization | Chart components | Chart components | 2025-01-15 | ✅ Complete |
| Performance Hooks | Performance utilities | usePerformanceOptimization | All components | 2025-01-15 | ✅ Complete |
| Debouncing | Input debouncing | usePerformanceOptimization | Search, filters | 2025-01-15 | ✅ Complete |
| Throttling | Event throttling | usePerformanceOptimization | Scroll, resize | 2025-01-15 | ✅ Complete |

## SECURITY PATTERNS

| Pattern | Purpose | Location | Used By | Last Updated | Status |
|---------|---------|----------|---------|-------------|---------|
| Input Validation | Data sanitization | VALIDATION_RULES | Forms | 2025-01-15 | ✅ Complete |
| Privacy Mode | Data masking | FinancialContext | Sensitive data | 2025-01-15 | ✅ Complete |
| Error Sanitization | Safe error messages | Error handling | User feedback | 2025-01-15 | ✅ Complete |
| Service Layer | Secure data access | DataService | Backend integration | 2025-01-15 | ✅ Complete |
| Firebase Security | Database security | Firebase rules | Data protection | 2025-01-15 | ✅ Complete |
| Authentication | User verification | AuthContext | User access | 2025-01-15 | ✅ Complete |

## DEPENDENCY VERSIONS

| Package | Version | Purpose | Last Updated | Status |
|---------|---------|---------|-------------|---------|
| React | 18.2.0 | UI framework | 2025-01-15 | ✅ Current |
| TypeScript | 4.9.5 | Type safety | 2025-01-15 | ✅ Current |
| Tailwind CSS | 3.3.0 | Styling | 2025-01-15 | ✅ Current |
| Lucide React | 0.263.1 | Icons | 2025-01-15 | ✅ Current |
| Firebase | 10.x.x | Backend services | 2025-01-15 | ✅ Current |
| Chart.js | 4.x.x | Chart library | 2025-01-15 | ✅ Current |
| react-chartjs-2 | 5.x.x | React Chart.js wrapper | 2025-01-15 | ✅ Current |
| date-fns | 2.x.x | Date utilities | 2025-01-15 | ✅ Current |
| csv-stringify | 6.x.x | CSV export | 2025-01-15 | ✅ Current |
| Jest | Latest | Testing | 2025-01-15 | ✅ Current |
| React Testing Library | Latest | Component testing | 2025-01-15 | ✅ Current |

## DEPENDENCY CONFLICTS

| Conflict | Components Involved | Resolution | Status |
|----------|-------------------|------------|---------|
| None identified | - | - | ✅ Resolved |

## MIGRATION NOTES

| Component | Migration Required | Reason | Priority | Status |
|-----------|------------------|---------|----------|---------|
| None | - | - | - | ✅ Up to date |

## FUTURE DEPENDENCIES

| Dependency | Purpose | Timeline | Priority | Status |
|------------|---------|----------|----------|---------|
| React Router | Navigation | Phase 2 | Medium | 📋 Planned |
| React Query | Data fetching | Phase 2 | Medium | 📋 Planned |
| React Hook Form | Form management | Phase 2 | Low | 📋 Planned |
| React Window | Virtual scrolling | Phase 3 | Medium | 📋 Planned |
| Workbox | Service worker | Phase 3 | Low | 📋 Planned | 