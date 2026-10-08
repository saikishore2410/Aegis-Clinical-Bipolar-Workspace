# QA Execution Documentation — Aegis-Clinical-Bipolar-Workspace

## QA coverage
- Source and repository integrity
- Build/dependency configuration
- Automated tests and CI
- Core functional scenarios
- Invalid-input and failure-path scenarios
- Security-sensitive configuration
- Deployment/runtime configuration

## Execution procedure
1. Establish repository entry points and technology stack.
2. Identify native install/build/test commands.
3. Execute available automated validation through CI or repository tooling.
4. Inspect important functional and error-handling paths.
5. Review security-sensitive configuration and secret handling.
6. Record confirmed defects and their remediation.
7. Re-run affected validation after each fix.

## Evidence policy
**Executed** means a test/build/CI/runtime check actually produced evidence. **Inspected** means static source/configuration review. **Blocked** means execution prerequisites are unavailable. No unsupported pass/fail claim is made.

## Defect policy
Only reproducible or directly evidenced defects are fixed. Missing or incomplete functionality is documented as a limitation.

## Status
**QA execution documentation completed.**