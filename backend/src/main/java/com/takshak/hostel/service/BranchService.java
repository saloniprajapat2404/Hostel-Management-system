package com.takshak.hostel.service;

import com.takshak.hostel.dto.BranchDto;
import com.takshak.hostel.dto.CitySummaryDto;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class BranchService {

    private final BranchRepository branchRepository;

    public BranchService(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    public List<BranchDto> list(String city) {
        User current = SecurityUtils.currentUser();
        if (current.getRole() == Role.SUPER_ADMIN) {
            List<Branch> branches = city != null && !city.isBlank()
                    ? branchRepository.findByCityIgnoreCaseOrderByNameAsc(city.trim())
                    : branchRepository.findAllByOrderByNameAsc();
            return branches.stream().map(BranchDto::from).toList();
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

    public List<CitySummaryDto> listCities() {
        assertSuperAdmin();
        Map<String, CitySummaryDto> byCity = new LinkedHashMap<>();
        for (Branch branch : branchRepository.findAllByOrderByNameAsc()) {
            String city = branch.getCity() == null || branch.getCity().isBlank()
                    ? "Unassigned"
                    : branch.getCity().trim();
            String key = city.toLowerCase(Locale.ROOT);
            CitySummaryDto existing = byCity.get(key);
            long total = existing == null ? 0 : existing.branchCount();
            long active = existing == null ? 0 : existing.activeBranchCount();
            if (branch.getStatus() == BranchStatus.ACTIVE) {
                active++;
            }
            byCity.put(key, new CitySummaryDto(city, citySlug(city), total + 1, active));
        }
        return byCity.values().stream()
                .sorted(Comparator.comparing(CitySummaryDto::city, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public BranchDto getByIdOrSlug(String idOrSlug) {
        User current = SecurityUtils.currentUser();
        Branch branch = resolveBranch(idOrSlug);
        assertCanView(current, branch);
        return BranchDto.from(branch);
    }

    public BranchDto create(CreateBranchRequest request) {
        assertSuperAdmin();
        String city = request.city().trim();
        String locality = request.name().trim();
        String slug = normalizeSlug(request.slug());
        String code = request.code().trim().toUpperCase(Locale.ROOT);

        assertLocalityUnique(city, locality, null);
        if (branchRepository.existsBySlug(slug)) {
            throw new ApiException("Branch slug already exists", 409);
        }
        if (branchRepository.existsByCodeIgnoreCase(code)) {
            throw new ApiException("Branch code already exists", 409);
        }

        Branch branch = new Branch();
        branch.setName(locality);
        branch.setCode(code);
        branch.setSlug(slug);
        branch.setCity(city);
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

        String nextCity = request.city() != null && !request.city().isBlank()
                ? request.city().trim()
                : branch.getCity();
        String nextName = request.name() != null && !request.name().isBlank()
                ? request.name().trim()
                : branch.getName();
        assertLocalityUnique(nextCity, nextName, id);

        if (request.name() != null && !request.name().isBlank()) {
            branch.setName(request.name().trim());
        }
        if (request.code() != null && !request.code().isBlank()) {
            String code = request.code().trim().toUpperCase(Locale.ROOT);
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

    public static String citySlug(String city) {
        return city.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }

    private void assertLocalityUnique(String city, String locality, String excludeId) {
        branchRepository.findByCityIgnoreCaseAndNameIgnoreCase(city, locality)
                .filter(existing -> excludeId == null || !existing.getId().equals(excludeId))
                .ifPresent(existing -> {
                    throw new ApiException(
                            "A locality branch named \"" + locality + "\" already exists in " + city, 409);
                });
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
        return slug.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "-");
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
