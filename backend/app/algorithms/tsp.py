import time
from typing import List, Dict, Any, Tuple, Optional

# Priority weights: Higher priority delivers earlier
PRIORITY_WEIGHTS = {
    "urgent": 4,
    "high": 3,
    "normal": 2,
    "low": 1
}

def calculate_tour_cost(
    tour: List[int],
    cost_matrix: List[List[float]],
    return_to_depot: bool = False
) -> float:
    """
    Calculates total road network cost along the tour.
    If return_to_depot is True (closed route), adds final leg from tour[-1] back to tour[0].
    Handles asymmetric road cost matrices correctly.
    """
    if len(tour) < 2:
        return 0.0

    total = 0.0
    for i in range(len(tour) - 1):
        u = tour[i]
        v = tour[i + 1]
        total += cost_matrix[u][v]

    if return_to_depot:
        total += cost_matrix[tour[-1]][tour[0]]

    return total

def nearest_neighbor_tour(
    cost_matrix: List[List[float]],
    start_idx: int = 0,
    return_to_depot: bool = False
) -> Tuple[List[int], float]:
    """
    Constructs an initial delivery tour using the greedy Nearest Neighbor heuristic.
    Always starts at start_idx (depot at 0) and greedily visits the closest unvisited stop.
    Time Complexity: O(N^2)
    """
    n = len(cost_matrix)
    if n <= 1:
        return [0], 0.0

    unvisited = set(range(n))
    unvisited.remove(start_idx)
    tour = [start_idx]
    current = start_idx

    while unvisited:
        nearest = min(unvisited, key=lambda node: cost_matrix[current][node])
        tour.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    cost = calculate_tour_cost(tour, cost_matrix, return_to_depot=return_to_depot)
    return tour, cost

def two_opt_tour(
    cost_matrix: List[List[float]],
    initial_tour: Optional[List[int]] = None,
    return_to_depot: bool = False,
    max_iterations: int = 500,
    epsilon: float = 1e-4
) -> Tuple[List[int], float, int]:
    """
    Improves an existing delivery tour using 2-Opt local search refinement.
    Systematically considers reversing tour segments tour[i:k+1].
    The depot (index 0) remains firmly anchored at the start of the tour.
    Accurately computes asymmetric edge costs.
    Time Complexity: O(Iterations * N^2)
    """
    n = len(cost_matrix)
    if n <= 2:
        tour = list(range(n))
        return tour, calculate_tour_cost(tour, cost_matrix, return_to_depot=return_to_depot), 0

    if initial_tour is None:
        tour, _ = nearest_neighbor_tour(cost_matrix, return_to_depot=return_to_depot)
    else:
        tour = list(initial_tour)

    best_cost = calculate_tour_cost(tour, cost_matrix, return_to_depot=return_to_depot)
    improved = True
    iterations = 0

    while improved and iterations < max_iterations:
        improved = False
        iterations += 1

        # Fix start at index 0 (depot/warehouse)
        for i in range(1, n - 1):
            for k in range(i + 1, n):
                # 2-opt swap reverses the subsegment from i to k
                new_tour = tour[:i] + tour[i:k + 1][::-1] + tour[k + 1:]
                new_cost = calculate_tour_cost(new_tour, cost_matrix, return_to_depot=return_to_depot)

                if new_cost < best_cost - epsilon:
                    tour = new_tour
                    best_cost = new_cost
                    improved = True
                    break
            if improved:
                break

    return tour, best_cost, iterations

def exact_tsp_held_karp(
    cost_matrix: List[List[float]],
    start_idx: int = 0,
    return_to_depot: bool = False
) -> Tuple[List[int], float]:
    """
    Computes mathematically guaranteed optimal delivery route starting at 0
    using Dynamic Programming (Held-Karp algorithm).
    Supports closed (return_to_depot=True) and open (return_to_depot=False) tours.
    Practical for N <= 10 stops.
    Time Complexity: O(N^2 * 2^N)
    """
    n = len(cost_matrix)
    if n <= 1:
        return [0], 0.0
    if n == 2:
        cost = cost_matrix[0][1] + (cost_matrix[1][0] if return_to_depot else 0.0)
        return [0, 1], cost

    # Vertices to visit: {1, ..., n-1}
    memo: Dict[Tuple[int, int], Tuple[float, int]] = {}

    def get_min_cost(mask: int, u: int) -> Tuple[float, int]:
        # mask represents visited subset among {1..n-1}
        # base case: all vertices visited
        if mask == (1 << (n - 1)) - 1:
            return (cost_matrix[u][0] if return_to_depot else 0.0), -1

        state = (mask, u)
        if state in memo:
            return memo[state]

        min_c = float('inf')
        best_next = -1

        for v in range(1, n):
            bit = 1 << (v - 1)
            if not (mask & bit):
                next_mask = mask | bit
                edge_cost = cost_matrix[u][v]
                sub_cost, _ = get_min_cost(next_mask, v)
                total = edge_cost + sub_cost
                if total < min_c:
                    min_c = total
                    best_next = v

        memo[state] = (min_c, best_next)
        return min_c, best_next

    total_opt_cost, first_next = get_min_cost(0, 0)

    # Reconstruct optimal tour
    tour = [0]
    curr_u = 0
    curr_mask = 0
    while len(tour) < n:
        _, next_u = memo[(curr_mask, curr_u)]
        if next_u == -1:
            break
        tour.append(next_u)
        curr_mask |= (1 << (next_u - 1))
        curr_u = next_u

    return tour, total_opt_cost

def apply_priority_constraints(
    tour: List[int],
    priorities: List[str],
    cost_matrix: List[List[float]],
    return_to_depot: bool = False
) -> List[int]:
    """
    Adjusts tour ordering considering delivery priority levels (urgent, high, normal, low).
    Preserves depot at index 0, sorts remaining stops with priority-informed order,
    then executes local 2-opt refinement.
    """
    if len(tour) <= 2:
        return tour

    stop_priorities = [0] + [PRIORITY_WEIGHTS.get(p.lower(), 2) for p in priorities]
    if len(set(stop_priorities[1:])) <= 1:
        return tour

    stops = tour[1:]
    stops_sorted = sorted(stops, key=lambda idx: stop_priorities[idx], reverse=True)
    initial_priority_tour = [0] + stops_sorted

    refined_tour, _, _ = two_opt_tour(
        cost_matrix,
        initial_tour=initial_priority_tour,
        return_to_depot=return_to_depot,
        max_iterations=50
    )
    return refined_tour

def optimize_delivery_route(
    cost_matrix: List[List[float]],
    algorithm: str = "nearest_neighbor_2opt",
    priorities: Optional[List[str]] = None,
    enforce_priorities: bool = True,
    return_to_depot: bool = False
) -> Dict[str, Any]:
    """
    Authoritative delivery route optimization pipeline:
    1. Evaluates baseline user entered sequential order [0, 1, 2, ..., n-1]
    2. Builds initial tour with Nearest Neighbor heuristic
    3. Runs 2-Opt local search improvement
    4. Runs Exact Dynamic Programming (Held-Karp) if N <= 9
    5. Guarantees that optimized result is never worse than the baseline
    6. Computes exact distance / duration savings and percentage improvement
    """
    start_time = time.perf_counter()
    n = len(cost_matrix)

    if n <= 1:
        return {
            "algorithm": algorithm,
            "ordered_indices": [0],
            "total_cost": 0.0,
            "original_cost": 0.0,
            "cost_improvement_percent": 0.0,
            "distance_saved": 0.0,
            "iterations": 0,
            "execution_time_ms": 0.0,
            "return_to_depot": return_to_depot,
            "comparison": {}
        }

    # 1. Baseline: user's sequential order with the same destination policy
    original_tour = list(range(n))
    original_cost = calculate_tour_cost(original_tour, cost_matrix, return_to_depot=return_to_depot)

    # 2. Nearest Neighbor initial solution
    nn_tour, nn_cost = nearest_neighbor_tour(cost_matrix, start_idx=0, return_to_depot=return_to_depot)

    # 3. 2-Opt local search improvement starting from Nearest Neighbor
    two_opt_res_tour, two_opt_cost, iterations = two_opt_tour(
        cost_matrix,
        initial_tour=nn_tour,
        return_to_depot=return_to_depot
    )

    # 4. Exact Held-Karp if n <= 9
    exact_tour = None
    exact_cost = None
    if n <= 9:
        exact_tour, exact_cost = exact_tsp_held_karp(cost_matrix, start_idx=0, return_to_depot=return_to_depot)

    # Choose candidate according to selected algorithm
    if algorithm == "nearest_neighbor":
        chosen_tour = nn_tour
        chosen_cost = nn_cost
    elif algorithm == "exact_tsp" and exact_tour is not None:
        chosen_tour = exact_tour
        chosen_cost = exact_cost
    elif algorithm == "original":
        chosen_tour = original_tour
        chosen_cost = original_cost
    else:
        # Default: nearest_neighbor_2opt
        chosen_tour = two_opt_res_tour
        chosen_cost = two_opt_cost

    # Apply priority constraints if requested
    if enforce_priorities and priorities and len(priorities) == n - 1:
        priority_tour = apply_priority_constraints(
            chosen_tour, priorities, cost_matrix, return_to_depot=return_to_depot
        )
        priority_cost = calculate_tour_cost(priority_tour, cost_matrix, return_to_depot=return_to_depot)
        chosen_tour = priority_tour
        chosen_cost = priority_cost

    # SAFETY CHECK: Ensure optimized result is never worse than baseline sequential sequence
    if chosen_cost > original_cost:
        chosen_tour = original_tour
        chosen_cost = original_cost

    exec_time_ms = round((time.perf_counter() - start_time) * 1000, 3)

    # Calculate authoritative cost reduction and percentage improvement
    cost_reduction = original_cost - chosen_cost
    if original_cost > 0.0:
        improvement_pct = round((cost_reduction / original_cost * 100.0), 2)
    else:
        improvement_pct = 0.0

    comparison = {
        "original": {"tour": original_tour, "cost": round(original_cost, 2)},
        "nearest_neighbor": {"tour": nn_tour, "cost": round(nn_cost, 2)},
        "nearest_neighbor_2opt": {
            "tour": two_opt_res_tour,
            "cost": round(two_opt_cost, 2),
            "iterations": iterations
        }
    }
    if exact_tour is not None:
        comparison["exact_optimal"] = {"tour": exact_tour, "cost": round(exact_cost, 2)}

    return {
        "algorithm": algorithm,
        "ordered_indices": chosen_tour,
        "total_cost": round(chosen_cost, 2),
        "original_cost": round(original_cost, 2),
        "cost_improvement_percent": improvement_pct,
        "distance_saved": round(cost_reduction, 2),
        "iterations": iterations if algorithm == "nearest_neighbor_2opt" else 0,
        "execution_time_ms": exec_time_ms,
        "return_to_depot": return_to_depot,
        "comparison": comparison
    }
