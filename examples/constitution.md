# Engineering Principles

Place this at `.feature/constitution.md` in your project root.
All feature designs and implementations will be validated against these principles.

1. Reuse existing libraries where possible.
2. Do not introduce infrastructure without justification.
3. All APIs require integration tests.
4. Database changes must be backward compatible.
5. Controllers must not directly access repositories.
6. External calls require timeout handling.
7. Security-sensitive APIs require authorization tests.
