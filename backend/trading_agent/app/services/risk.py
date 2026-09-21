from app.models import Position

def calculate_risk(symbol: str, current_price: float | None, account_size: float | None,
                   max_risk_pct: float, stop_price: float | None,
                   portfolio: list[Position]) -> dict:
    matching = [p for p in portfolio if p.symbol.upper() == symbol.upper()]
    portfolio_value = sum(p.quantity * (p.current_price or p.entry_price) for p in portfolio)
    symbol_value = sum(p.quantity * (p.current_price or p.entry_price) for p in matching)
    exposure_pct = (symbol_value / portfolio_value * 100) if portfolio_value else 0
    output = {
        "existing_positions": len(matching),
        "symbol_market_value": round(symbol_value, 2),
        "portfolio_value": round(portfolio_value, 2),
        "symbol_exposure_pct": round(exposure_pct, 2),
        "max_risk_pct": max_risk_pct,
    }
    if account_size and current_price and stop_price and current_price != stop_price:
        risk_budget = account_size * (max_risk_pct / 100)
        risk_per_share = abs(current_price - stop_price)
        max_quantity = int(risk_budget // risk_per_share)
        output.update({
            "risk_budget": round(risk_budget, 2),
            "risk_per_share": round(risk_per_share, 2),
            "max_quantity_by_risk": max_quantity,
            "max_position_value_by_risk": round(max_quantity * current_price, 2),
        })
    return output
