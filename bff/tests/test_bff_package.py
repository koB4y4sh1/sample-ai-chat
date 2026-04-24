def test_bff_package_importable() -> None:
    import bff

    assert bff.__doc__ is not None
