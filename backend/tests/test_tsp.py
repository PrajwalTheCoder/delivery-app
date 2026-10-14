import pytest
from app.algorithms.tsp import (
    calculate_tour_cost,
    nearest_neighbor_tour,
    two_opt_tour,
    exact_tsp_held_karp,
    optimize_delivery_route
)

def test_tsp_empty_and_single_stop():
    # 0 nodes (empty)
    res_empty = optimize_delivery_route([], algorithm="nearest_neighbor")
    assert res_empty["total_cost"] == 0.0

    # 1 node (start only)
    res_single = optimize_delivery_route([[0.0]], algorithm="nearest_neighbor_2opt")
    assert res_single["total_cost"] == 0.0
    assert res_single["ordered_indices"] == [0]

def test_tsp_two_stops():
    # Start (0) and 1 stop (1)
    matrix = [
        [0.0, 150.0],
        [150.0, 0.0]
    ]
    res = optimize_delivery_route(matrix, algorithm="nearest_neighbor_2opt")
    assert res["ordered_indices"] == [0, 1]
    assert res["total_cost"] == 150.0

def test_nearest_neighbor_greedy_behavior():
    # Matrix where from 0, stop 2 is closer than stop 1
    # 0 -> 2 cost is 10, 0 -> 1 cost is 50
    matrix = [
        [0.0, 50.0, 10.0],
        [50.0, 0.0, 20.0],
        [10.0, 20.0, 0.0]
    ]
    tour, cost = nearest_neighbor_tour(matrix, start_idx=0)
    # Greedy choice from 0 is 2, then remaining is 1: tour [0, 2, 1]
    assert tour == [0, 2, 1]
    # Cost: 10 + 20 = 30
    assert cost == 30.0

def test_two_opt_untangles_crossing_route():
    # Cost matrix where a criss-cross route exists:
    # 0 -> 1 -> 2 -> 3 has cost 100 + 100 + 100 = 300
    # but 0 -> 2 -> 1 -> 3 has cost 30 + 20 + 30 = 80
    matrix = [
        [0.0, 100.0, 30.0, 80.0],
        [100.0, 0.0, 20.0, 100.0],
        [30.0, 20.0, 0.0, 90.0],
        [80.0, 100.0, 90.0, 0.0]
    ]
    initial_bad_tour = [0, 1, 2, 3]
    initial_cost = calculate_tour_cost(initial_bad_tour, matrix)

    improved_tour, improved_cost, iters = two_opt_tour(matrix, initial_tour=initial_bad_tour)
    assert improved_cost < initial_cost
    assert iters >= 1

def test_exact_held_karp_finds_optimal_on_known_instance():
    # 4 locations (1 warehouse, 3 stops)
    matrix = [
        [0.0, 10.0, 15.0, 20.0],
        [10.0, 0.0, 35.0, 25.0],
        [15.0, 35.0, 0.0, 30.0],
        [20.0, 25.0, 30.0, 0.0]
    ]
    exact_tour, exact_cost = exact_tsp_held_karp(matrix, start_idx=0)
    assert exact_tour[0] == 0
    assert set(exact_tour) == {0, 1, 2, 3}

    # Verify that Held-Karp cost is <= any permutation cost starting at 0
    import itertools
    all_perm_costs = []
    for p in itertools.permutations([1, 2, 3]):
        cand = [0] + list(p)
        all_perm_costs.append(calculate_tour_cost(cand, matrix))

    assert exact_cost == min(all_perm_costs)
