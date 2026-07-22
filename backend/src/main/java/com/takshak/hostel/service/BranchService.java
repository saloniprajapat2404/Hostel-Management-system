package com.takshak.hostel.service;

import com.takshak.hostel.dto.BranchDto;
import com.takshak.hostel.dto.CreateBranchRequest;
import com.takshak.hostel.dto.UpdateBranchRequest;
import com.takshak.hostel.entity.Branch;
import com.takshak.hostel.entity.User;
import com.takshak.hostel.enums.BranchStatus;
import com.takshak.hostel.enums.Role;
import com.takshak.hostel.exception.ApiException;
import com.takshak.hostel.repository.BranchRepository;
import com.takshak.hostel.security.SecurityUtils;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class BranchService {

    private final BranchRepository branchRepository;

    public BranchService(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    public List<BranchDto> list() {
        User current = SecurityUtils.currentUser();
        if (current.getRole() == Role.SUPER_ADMIN) {
            return branchRepository.findAllByOrderByNameAsc().stream()
                    .map(BranchDto::from)
                    .toList();
        }
        if (current.getRole() == Role.ADMIN) {
            if (current.getBranchId() == null) {
                throw new ApiException("Admin is not assigned to a branch", 403);
            }
            return branchRepository.findById(current.getBranchId())
                    .map(branch -> List.of(BranchDto.from(branch)))
                    .orElse(List.of());
        }
        throw new ApiException("Access denied", 403);
    }

    public BranchDto getByIdOrSlug(String idOrSlug) {
        User current = SecurityUtils.currentUser();
        Branch branch = resolveBranch(idOrSlug);
        assertCanView(current, branch);
        return BranchDto.from(branch);
    }

    public BranchDto create(CreateBranchRequest request) {
        assertSuperAdmin();
        String slug = normalizeSlug(request.slug());
        String code = request.code().trim().toUpperCase();
        if (branchRepository.existsBySlug(slug)) {
            throw new ApiException("Branch slug already exists", 409);
        }
        if (branchRepository.existsByCodeIgnoreCase(code)) {
            throw new ApiException("Branch code already exists", 409);
        }

        Branch branch = new Branch();
        branch.setName(request.name().trim());
        branch.setCode(code);
        branch.setSlug(slug);
        branch.setCity(request.city().trim());
        branch.setAddress(trimToNull(request.address()));
        branch.setPhone(trimToNull(request.phone()));
        branch.setEmail(trimToNull(request.email()));
        branch.setStatus(request.status() != null ? request.status() : BranchStatus.ACTIVE);
        branch.setCreatedAt(Instant.now());
        branch.setUpdatedAt(Instant.now());
        return BranchDto.from(branchRepository.save(branch));
    }

    public BranchDto update(String id, UpdateBranchRequest request) {
        assertSuperAdmin();
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ApiException("Branch not found", 404));

        if (request.name() != null && !request.name().isBlank()) {
            branch.setName(request.name().trim());
        }
        if (request.code() != null && !request.code().isBlank()) {
            String code = request.code().trim().toUpperCase();
            branchRepository.findByCodeIgnoreCase(code)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new ApiException("Branch code already exists", 409);
                    });
            branch.setCode(code);
        }
        if (request.slug() != null && !request.slug().isBlank()) {
            String slug = normalizeSlug(request.slug());
            branchRepository.findBySlug(slug)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new ApiException("Branch slug already exists", 409);
                    });
            branch.setSlug(slug);
        }
        if (request.city() != null && !request.city().isBlank()) {
            branch.setCity(request.city().trim());
        }
        if (request.address() != null) {
            branch.setAddress(trimToNull(request.address()));
        }
        if (request.phone() != null) {
            branch.setPhone(trimToNull(request.phone()));
        }
        if (request.email() != null) {
            branch.setEmail(trimToNull(request.email()));
        }
        if (request.status() != null) {
            branch.setStatus(request.status());
        }
        branch.setUpdatedAt(Instant.now());
        return BranchDto.from(branchRepository.save(branch));
    }

    public void delete(String id) {
        assertSuperAdmin();
        if (!branchRepository.existsById(id)) {
            throw new ApiException("Branch not found", 404);
        }
        branchRepository.deleteById(id);
    }

    public Branch resolveBranch(String idOrSlug) {
        return branchRepository.findById(idOrSlug)
                .or(() -> branchRepository.findBySlug(idOrSlug))
                .orElseThrow(() -> new ApiException("Branch not found", 404));
    }

    private void assertCanView(User current, Branch branch) {
        if (current.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (current.getRole() == Role.ADMIN && branch.getId().equals(current.getBranchId())) {
            return;
        }
        throw new ApiException("Access denied", 403);
    }

    private void assertSuperAdmin() {
        if (SecurityUtils.currentUser().getRole() != Role.SUPER_ADMIN) {
            throw new ApiException("Access denied", 403);
        }
    }

    private String normalizeSlug(String slug) {
        return slug.trim().toLowerCase().replaceAll("\\s+", "-");
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
