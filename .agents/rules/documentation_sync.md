# Documentation Sync Rule

Whenever any feature, bug fix, architectural change, or database update is implemented in this repository:
1. Update `PROJECT_MASTER_GUIDE.md` with the latest changes, features, schemas, and commit notes.
2. Update `generate_docs.py` and run `python generate_docs.py` to regenerate `PROJECT_MASTER_DOCUMENTATION.docx`.
3. Keep both documents continuously updated so that future developers and AI assistants always have the exact, up-to-date context of the entire project without needing to re-scan.
