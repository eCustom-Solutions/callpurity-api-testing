# Parity Checker TODO

## Refactoring Plans

### Directory Structure Improvements
- [ ] Move `index.ts` to `bin/index.ts` for better organization
- [ ] Create `src/` directory for source files
- [ ] Move `loader/`, `writer/`, and `reconcile.ts` into `src/`
- [ ] Create `data/` directory for sample files
- [ ] Move `sample_numbers.csv` to `data/`

### Code Organization
- [ ] Separate CLI logic from business logic
- [ ] Add proper error handling and validation
- [ ] Implement configuration management
- [ ] Add logging framework
- [ ] Create proper TypeScript interfaces for all data structures

### Testing
- [ ] Add unit tests for individual modules
- [ ] Add integration tests for the full workflow
- [ ] Add test coverage reporting
- [ ] Create test data fixtures

### Documentation
- [ ] Add JSDoc comments to all functions
- [ ] Create API documentation
- [ ] Add usage examples
- [ ] Document configuration options

### Features
- [ ] Add support for different output formats (JSON, CSV)
- [ ] Implement dry-run vs actual execution modes
- [ ] Add progress indicators for large datasets
- [ ] Support for batch processing
- [ ] Add retry logic for API calls

### Performance
- [ ] Implement streaming for large CSV files
- [ ] Add caching for API responses
- [ ] Optimize memory usage for large datasets
- [ ] Add performance monitoring

### Error Handling
- [ ] Improve error messages and logging
- [ ] Add graceful degradation for partial failures
- [ ] Implement proper exit codes
- [ ] Add validation for input files and API responses

## Notes
- Current version is stable and functional
- Refactoring should maintain backward compatibility
- Consider breaking changes for major version updates 